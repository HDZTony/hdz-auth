import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { AuthService, TokenStorage } from './types'

export interface CreateAuthServiceOptions {
  /** Optional app-specific cleanup when session clears (e.g. clear other stores). */
  onSessionCleared?: () => void
}

export function createAuthService(
  supabase: SupabaseClient,
  tokenStorage: TokenStorage,
  options: CreateAuthServiceOptions = {},
): AuthService {
  let session: Session | null = null
  let isLoading = true
  let unsubscribe: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null

  const syncToken = (next: Session | null) => {
    session = next
    if (next?.access_token) tokenStorage.setAccessToken(next.access_token)
    else {
      tokenStorage.clearAccessToken()
      options.onSessionCleared?.()
    }
  }

  const loadSession = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) console.warn('[hdz-auth] getSession failed:', error)
    syncToken(data.session ?? null)
    isLoading = false
    return session
  }

  const refreshSession = () => loadSession()

  const setupAuthListener = () => {
    if (unsubscribe) return
    unsubscribe = supabase.auth.onAuthStateChange((_event, newSession) => {
      syncToken(newSession)
      isLoading = false
    })
  }

  const cleanup = () => {
    unsubscribe?.data.subscription.unsubscribe()
    unsubscribe = null
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithPassword = async (email: string, password: string, redirectTo?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (error) throw error
    if (data.session) syncToken(data.session)
    return { needsEmailConfirmation: !data.session }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    syncToken(null)
  }

  return {
    get session() {
      return session
    },
    get isLoading() {
      return isLoading
    },
    get isAuthenticated() {
      return !!session
    },
    get user(): User | null {
      return session?.user ?? null
    },
    get accessToken() {
      return session?.access_token ?? tokenStorage.getAccessToken()
    },
    loadSession,
    refreshSession,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    setupAuthListener,
    cleanup,
  }
}

/** Pinia-friendly reactive wrapper (optional). */
export function createReactiveAuthBindings(service: AuthService) {
  return {
    get session() {
      return service.session
    },
    get isLoading() {
      return service.isLoading
    },
    get isAuthenticated() {
      return service.isAuthenticated
    },
    get user() {
      return service.user
    },
    get accessToken() {
      return service.accessToken
    },
    loadSession: () => service.loadSession(),
    refreshSession: () => service.refreshSession(),
    signInWithPassword: (email: string, password: string) => service.signInWithPassword(email, password),
    signUpWithPassword: (email: string, password: string, redirectTo?: string) =>
      service.signUpWithPassword(email, password, redirectTo),
    signOut: () => service.signOut(),
    setupAuthListener: () => service.setupAuthListener(),
    cleanup: () => service.cleanup(),
  }
}
