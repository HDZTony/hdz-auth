import { AUTH_TOKEN_KEY, type TokenStorage } from '../types'

const STORE_FILE = 'hdz-auth.json'
const STORE_KEY = AUTH_TOKEN_KEY

type TauriStore = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  save(): Promise<void>
}

let storePromise: Promise<TauriStore> | null = null

async function getStore(): Promise<TauriStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const { load } = await import('@tauri-apps/plugin-store')
      return load(STORE_FILE, { autoSave: true, defaults: {} })
    })()
  }
  return storePromise
}

/** Tauri desktop: persist token in plugin-store (no cookies). */
export function tauriTokenStorage(key = STORE_KEY): TokenStorage {
  return {
    getAccessToken() {
      // Sync read isn't available; callers should use auth service session first.
      // Fallback for API client: read from memory cache populated by auth service.
      return memoryCache.get(key) ?? null
    },
    setAccessToken(token: string) {
      memoryCache.set(key, token)
      void (async () => {
        const store = await getStore()
        await store.set(key, token)
        await store.save()
      })()
    },
    clearAccessToken() {
      memoryCache.delete(key)
      void (async () => {
        const store = await getStore()
        await store.delete(key)
        await store.save()
      })()
    },
  }
}

const memoryCache = new Map<string, string>()

/** Hydrate Tauri memory cache on startup (call once from auth service). */
export async function hydrateTauriTokenStorage(key = STORE_KEY): Promise<string | null> {
  try {
    const store = await getStore()
    const token = await store.get<string>(key)
    if (token) memoryCache.set(key, token)
    return token ?? null
  } catch {
    return null
  }
}
