import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { GrowthRecord } from '@/lib/types'
import UtviklingContent from '@/components/ui/UtviklingContent'
import { getBirthDate } from '@/lib/tabs'
import weightGirls from '@/public/data/who/weight-for-age-girls.json'
import heightGirls from '@/public/data/who/height-for-age-girls.json'

interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (...args: unknown[]) => void
}

export type WhoRow = { age_months: number; p3: number; p15: number; p50: number; p85: number; p97: number }

export default async function DinUtviklingPage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(
    cookieStore as unknown as MinimalCookieStore,
    sessionOptions
  )
  const isAuthenticated = session.isLoggedIn === true

  let records: GrowthRecord[] = []
  try {
    const { data } = await supabaseAdmin
      .from('growth_records')
      .select('*')
      .order('recorded_at', { ascending: true })
    records = (data ?? []) as GrowthRecord[]
  } catch {
    // env vars not set — empty state
  }

  let birthDateISO = ''
  try {
    birthDateISO = getBirthDate().toISOString().split('T')[0]
  } catch {
    // BIRTH_DATE not set
  }

  return (
    <UtviklingContent
      initialRecords={records}
      isAuthenticated={isAuthenticated}
      birthDateISO={birthDateISO}
      whoWeight={weightGirls as WhoRow[]}
      whoHeight={heightGirls as WhoRow[]}
    />
  )
}
