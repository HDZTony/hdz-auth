import { describe, expect, it } from 'vitest'
import { extractUserIdFromJwt, isJwtExpired } from '../src/jwt'

// Minimal JWT: header.payload.sig (sig not verified here)
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

describe('jwt', () => {
  it('extracts sub claim', () => {
    const token = makeJwt({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(extractUserIdFromJwt(token)).toBe('user-123')
  })

  it('detects expired token', () => {
    const expired = makeJwt({ sub: 'u', exp: 1 })
    expect(isJwtExpired(expired)).toBe(true)
  })
})
