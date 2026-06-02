import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { CreateApiClientOptions } from './types'

const RETRYABLE_STATUS_CODES = [502, 503, 504]
const MAX_GATEWAY_RETRIES = 2
const RETRY_BASE_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Axios instance with Bearer token injection and 401 refresh hook.
 * Environment-agnostic: caller supplies getToken (web localStorage, Tauri store, uni storage).
 */
export function createAuthenticatedApiClient(options: CreateApiClientOptions): AxiosInstance {
  const { baseURL, getToken, on401, timeout = 30000 } = options
  const maxRetries = options.gatewayRetries ?? MAX_GATEWAY_RETRIES

  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout,
  })

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (!originalRequest) return Promise.reject(error)

      const status = error.response?.status
      if (status && RETRYABLE_STATUS_CODES.includes(status)) {
        const retryCount: number = originalRequest._gatewayRetryCount ?? 0
        if (retryCount < maxRetries) {
          originalRequest._gatewayRetryCount = retryCount + 1
          const delay = RETRY_BASE_DELAY_MS * 2 ** retryCount
          await sleep(delay)
          return client(originalRequest)
        }
      }

      if (status === 401 && !originalRequest._retry && on401) {
        originalRequest._retry = true
        try {
          await on401()
          const token = getToken()
          if (token) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return client(originalRequest)
          }
        } catch (e) {
          console.warn('[hdz-auth] on401 failed:', e)
        }
      }
      return Promise.reject(error)
    },
  )

  return client
}
