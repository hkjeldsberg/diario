import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { EmailMessage, Letter } from '@/lib/types'
import PostboksContent from '@/components/ui/PostboksContent'

interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (...args: unknown[]) => void
}

async function getEmails(): Promise<{ emails: EmailMessage[]; error?: string }> {
  try {
    const { fetchEmails } = await import('@/lib/gmail')
    const emails = await fetchEmails()
    return { emails }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Postboks] fetchEmails threw:', msg)
    return { emails: [], error: msg }
  }
}

export default async function PostboksPage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(
    cookieStore as unknown as MinimalCookieStore,
    sessionOptions
  )
  const isAuthenticated = session.isLoggedIn === true

  let letters: Letter[] = []
  const { emails, error } = await getEmails()

  try {
    const { data } = await supabaseAdmin
      .from('letters')
      .select('*')
      .order('written_at', { ascending: false })
    letters = (data ?? []) as Letter[]
  } catch {
    // env vars not set — empty state
  }

  return (
    <PostboksContent
      emails={emails}
      initialLetters={letters}
      isAuthenticated={isAuthenticated}
      emailError={error}
    />
  )
}
