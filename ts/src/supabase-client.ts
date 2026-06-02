import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseAuthClientOptions } from './types'

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    throw new Error('Supabase URL is required')
  }
  return trimmed.replace(/\/+$/, '')
}

export function createSupabaseAuthClient(options: SupabaseAuthClientOptions): SupabaseClient {
  const url = normalizeSupabaseUrl(options.url)
  const anonKey = options.anonKey.trim()
  if (!anonKey) throw new Error('Supabase anon key is required')

  return createClient(url, anonKey, {
    auth: {
      storage: options.storage as Storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: options.detectSessionInUrl ?? typeof window !== 'undefined',
      flowType: 'pkce',
    },
  })
}
