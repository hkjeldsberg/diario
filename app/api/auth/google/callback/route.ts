import { NextRequest, NextResponse } from 'next/server'
import { saveRefreshToken } from '@/lib/token-store'

const CLIENT_CONFIG: Record<string, { id: string; secret: string }> = {
  gmail: {
    id: process.env.GOOGLE_CLIENT_ID!,
    secret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  photos: {
    id: process.env.GOOGLE_CLIENT_ID_PHOTOS!,
    secret: process.env.GOOGLE_CLIENT_SECRET_PHOTOS!,
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (error) return NextResponse.redirect(`${appUrl}/innstillinger?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${appUrl}/innstillinger?error=missing_params`)

  let service: string, userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    service = decoded.service
    userId = decoded.userId
  } catch {
    return NextResponse.redirect(`${appUrl}/innstillinger?error=invalid_state`)
  }

  const config = CLIENT_CONFIG[service]
  if (!config) return NextResponse.redirect(`${appUrl}/innstillinger?error=invalid_service`)

  const redirectUri = `${appUrl}/api/auth/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.id,
      client_secret: config.secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.refresh_token) {
    return NextResponse.redirect(`${appUrl}/innstillinger?error=no_refresh_token`)
  }

  await saveRefreshToken(service, userId, tokenData.refresh_token)

  return NextResponse.redirect(`${appUrl}/innstillinger?connected=${service}_${userId}`)
}
