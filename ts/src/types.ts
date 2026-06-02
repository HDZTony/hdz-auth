/** Shared auth token cookie / localStorage key used across web and edge routers. */
export const AUTH_TOKEN_KEY = 'auth_token'

export const AUTH_COOKIE_MAX_AGE_DAYS = 7

export interface TokenStorage {
  getAccessToken(): string | null
  setAccessToken(token: string): void
  clearAccessToken(): void
}

export interface SupabaseAuthClientOptions {
  url: string
  anonKey: string
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | {
    getItem: (key: string) => Promise<string | null> | string | null
    setItem: (key: string, value: string) => Promise<void> | void
    removeItem: (key: string) => Promise<void> | void
  }
  detectSessionInUrl?: boolean
}

export interface AuthService {
  session: import('@supabase/supabase-js').Session | null
  isLoading: boolean
  isAuthenticated: boolean
  user: import('@supabase/supabase-js').User | null
  accessToken: string | null
  loadSession: () => Promise<import('@supabase/supabase-js').Session | null>
  refreshSession: () => Promise<import('@supabase/supabase-js').Session | null>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string, redirectTo?: string) => Promise<{
    needsEmailConfirmation: boolean
  }>
  signOut: () => Promise<void>
  setupAuthListener: () => void
  cleanup: () => void
}

export type GetTokenFn = () => string | null
export type On401Fn = () => Promise<void>

export interface CreateApiClientOptions {
  baseURL: string
  getToken: GetTokenFn
  on401?: On401Fn
  timeout?: number
  gatewayRetries?: number
}
