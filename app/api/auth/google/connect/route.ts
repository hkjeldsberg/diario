import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

const SCOPES: Record<string, string> = {
  gmail: 'https://www.googleapis.com/auth/gmail.readonly',
  photos: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
}

function getClientId(service: string): string {
  return service === 'gmail'
    ? process.env.GOOGLE_CLIENT_ID!
    : process.env.GOOGLE_CLIENT_ID_PHOTOS!
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const service = searchParams.get('service')
  const userId = searchParams.get('userId') ?? 'primary'

  if (!service || !SCOPES[service]) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const redirectUri = `${appUrl}/api/auth/google/callback`
  const state = Buffer.from(JSON.stringify({ service, userId })).toString('base64')

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', getClientId(service))
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES[service])
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
