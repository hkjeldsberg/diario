import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from './session'
import { NextResponse } from 'next/server'

export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function getSession() {
  const cookieStore = cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
