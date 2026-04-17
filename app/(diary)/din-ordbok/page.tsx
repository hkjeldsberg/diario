import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { WordEntry, WordVariant } from '@/lib/types'
import OrdbokContent from '@/components/ui/OrdbokContent'

interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (...args: unknown[]) => void
}

export default async function DinOrdbokPage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(
    cookieStore as unknown as MinimalCookieStore,
    sessionOptions
  )
  const isAuthenticated = session.isLoggedIn === true

  let words: WordEntry[] = []

  try {
    const [{ data: entries }, { data: variants }] = await Promise.all([
      supabaseAdmin.from('word_entries').select('*').order('first_heard_at', { ascending: true }),
      supabaseAdmin.from('word_variants').select('*').order('recorded_at', { ascending: true }),
    ])

    words = ((entries ?? []) as WordEntry[]).map((e) => ({
      ...e,
      variants: ((variants ?? []) as WordVariant[]).filter((v) => v.word_entry_id === e.id),
    }))
  } catch {
    // env vars not set — empty state
  }

  return <OrdbokContent initialWords={words} isAuthenticated={isAuthenticated} />
}
