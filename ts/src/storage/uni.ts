import { AUTH_TOKEN_KEY, type TokenStorage } from '../types'

export interface UniLikeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** UniApp / mini-program: sync storage only, no cookies. */
export function uniTokenStorage(uniStorage: UniLikeStorage, key = AUTH_TOKEN_KEY): TokenStorage {
  return {
    getAccessToken() {
      try {
        return uniStorage.getItem(key)
      } catch {
        return null
      }
    },
    setAccessToken(token: string) {
      try {
        uniStorage.setItem(key, token)
      } catch {
        /* ignore */
      }
    },
    clearAccessToken() {
      try {
        uniStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    },
  }
}
