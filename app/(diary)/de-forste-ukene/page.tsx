import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { TAB_DEFINITIONS, getBirthDate, formatDateToISO } from '@/lib/tabs'
import { Entry } from '@/lib/types'
import DiaryTabContent from '@/components/ui/DiaryTabContent'

const TAB_KEY = 'de-forste-ukene'

interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (...args: unknown[]) => void
}

export default async function DeForsteUkenePage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(
    cookieStore as unknown as MinimalCookieStore,
    sessionOptions
  )
  const isAuthenticated = session.isLoggedIn === true

  let entries: Entry[] = []
  let minDate = ''
  let maxDate = ''

  try {
    const birthDate = getBirthDate()
    const tab = TAB_DEFINITIONS.find((t) => t.key === TAB_KEY)!
    const { from, to } = tab.getDateRange!(birthDate)
    minDate = formatDateToISO(from)
    maxDate = formatDateToISO(to)

    const { data } = await supabaseAdmin
      .from('entries')
      .select('*')
      .gte('date', minDate)
      .lte('date', maxDate)
      .order('date', { ascending: true })

    entries = (data as Entry[]) ?? []
  } catch {
    // Env vars not set — empty state
  }

  return (
    <DiaryTabContent
      initialEntries={entries}
      isAuthenticated={isAuthenticated}
      minDate={minDate}
      maxDate={maxDate}
      tabKey={TAB_KEY}
      heading="De første ukene"
      subtitle="Uke 3 – 8"
    />
  )
}
