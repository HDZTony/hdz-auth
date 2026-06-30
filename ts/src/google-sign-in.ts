import type { Session, SupabaseClient } from '@supabase/supabase-js'

const GOOGLE_GSI_SCRIPT = 'https://accounts.google.com/gsi/client'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: (options?: { prompt?: string }) => void }
        }
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In requires a browser environment'))
  }
  if (window.google?.accounts) {
    return Promise.resolve()
  }
  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_GSI_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

export interface GoogleNativeSession {
  access_token: string
  refresh_token: string
}

export async function exchangeGoogleNativeSession(
  apiBaseUrl: string,
  body: Record<string, string>,
): Promise<GoogleNativeSession> {
  const base = apiBaseUrl.replace(/\/+$/, '')
  const response = await fetch(`${base}/api/auth/google-native`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    error?: string
    detail?: string
  }

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || `Google native auth failed (${response.status})`)
  }
  if (!payload.access_token || !payload.refresh_token) {
    throw new Error('Google native auth returned incomplete session')
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  }
}

export async function requestGoogleWebAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityServices()
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google OAuth2 client unavailable')
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        if (!response.access_token) {
          reject(new Error('Google did not return an access token'))
          return
        }
        resolve(response.access_token)
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

export async function signInWithGoogleIdToken(
  supabase: SupabaseClient,
  idToken: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })
  if (error) throw error
  if (!data.session) {
    throw new Error('Google sign-in did not return a session')
  }
  return data.session
}

export interface SignInWithGoogleWebOptions {
  supabase: SupabaseClient
  apiBaseUrl: string
  googleClientId: string
  idToken?: string
}

export async function signInWithGoogleWeb({
  supabase,
  apiBaseUrl,
  googleClientId,
  idToken,
}: SignInWithGoogleWebOptions): Promise<Session> {
  if (!googleClientId.trim()) {
    throw new Error('Google client ID is not configured')
  }

  if (idToken) {
    return signInWithGoogleIdToken(supabase, idToken)
  }

  const accessToken = await requestGoogleWebAccessToken(googleClientId)
  const tokens = await exchangeGoogleNativeSession(apiBaseUrl, { access_token: accessToken })
  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  })
  if (error) throw error
  if (!data.session) {
    throw new Error('Failed to establish Supabase session')
  }
  return data.session
}
