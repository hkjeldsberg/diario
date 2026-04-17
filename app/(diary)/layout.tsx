import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'
import { SessionData, sessionOptions } from '@/lib/session'
import TabNav from '@/components/ui/TabNav'
import BotanicalBackground from '@/components/layout/BotanicalBackground'

// iron-session's CookieStore requires a `set` method, but Next.js ReadonlyRequestCookies
// only has `get`. The session is read-only in this layout context, so we cast safely.
interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (...args: unknown[]) => void
}

export default async function DiaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore as unknown as MinimalCookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-cream relative">
      <BotanicalBackground />
      <div className="relative z-10">
        <TabNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
