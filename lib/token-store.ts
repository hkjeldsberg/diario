import { supabaseAdmin } from './supabase'

export async function getRefreshToken(service: string, userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('google_tokens')
    .select('refresh_token')
    .eq('service', service)
    .eq('user_id', userId)
    .single()
  return data?.refresh_token ?? null
}

export async function saveRefreshToken(service: string, userId: string, refreshToken: string): Promise<void> {
  await supabaseAdmin
    .from('google_tokens')
    .upsert({ service, user_id: userId, refresh_token: refreshToken, updated_at: new Date().toISOString() })
}

export async function hasToken(service: string, userId: string): Promise<boolean> {
  const token = await getRefreshToken(service, userId)
  return token !== null
}
