import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { timingSafeEqual } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const users: Array<{ userId: string; envKey: string }> = [
      { userId: 'primary', envKey: 'APP_PASSWORD' },
      { userId: 'partner', envKey: 'APP_PASSWORD_PARTNER' },
    ]

    const providedBuffer = Buffer.from(password)
    let matchedUserId: string | null = null

    for (const { userId, envKey } of users) {
      const storedPassword = process.env[envKey]
      if (!storedPassword) continue
      const expectedBuffer = Buffer.from(storedPassword)
      if (
        providedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        matchedUserId = userId
        break
      }
    }

    if (!matchedUserId) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.isLoggedIn = true
    session.userId = matchedUserId
    await session.save()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
