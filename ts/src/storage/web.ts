import { AUTH_COOKIE_MAX_AGE_DAYS, AUTH_TOKEN_KEY, type TokenStorage } from './types'

export function getTokenFromCookie(name = AUTH_TOKEN_KEY): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(prefix)) continue
    const raw = trimmed.slice(prefix.length)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

export function setTokenInCookie(token: string, name = AUTH_TOKEN_KEY): void {
  if (typeof document === 'undefined') return
  const maxAge = AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString()
  let cookie = `${name}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`
  if (typeof location !== 'undefined' && location.protocol === 'https:') {
    cookie += '; Secure'
  }
  document.cookie = cookie
}

export function removeTokenFromCookie(name = AUTH_TOKEN_KEY): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/** Browser storage: localStorage + auth_token cookie (for SSR/page refresh). */
export function webTokenStorage(localStorageKey = AUTH_TOKEN_KEY): TokenStorage {
  return {
    getAccessToken() {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(localStorageKey) || getTokenFromCookie(localStorageKey)
    },
    setAccessToken(token: string) {
      if (typeof window === 'undefined') return
      localStorage.setItem(localStorageKey, token)
      setTokenInCookie(token, localStorageKey)
    },
    clearAccessToken() {
      if (typeof window === 'undefined') return
      localStorage.removeItem(localStorageKey)
      removeTokenFromCookie(localStorageKey)
    },
  }
}
