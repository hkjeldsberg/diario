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

    const appPassword = process.env.APP_PASSWORD
    if (!appPassword) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(password)
    const expectedBuffer = Buffer.from(appPassword)

    let isValid = false
    if (providedBuffer.length === expectedBuffer.length) {
      isValid = timingSafeEqual(providedBuffer, expectedBuffer)
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
