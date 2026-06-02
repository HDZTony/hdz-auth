/**
 * Extract Supabase user id (sub claim) from a JWT access token.
 * Works in browser, Workers, and Node without external deps.
 */
export function extractUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp <= Math.floor(Date.now() / 1000) + skewSeconds
  } catch {
    return true
  }
}
