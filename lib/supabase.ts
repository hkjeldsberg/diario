import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = ReturnType<typeof createClient<any, any, any>>

let _supabaseAdmin: AnySupabaseClient | null = null

function getSupabaseAdmin(): AnySupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'sofia',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _supabaseAdmin
}

// Lazy proxy — defers client instantiation until first use at runtime.
// This prevents the env-var check from throwing during Next.js build-time
// page data collection (when SUPABASE_URL is not set in CI/local builds).
export const supabaseAdmin = new Proxy({} as AnySupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof AnySupabaseClient]
  },
})

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'diario-media'
