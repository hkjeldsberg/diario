import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API routes to pass through
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/svgs') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Read cookie and unseal — RequestCookies is read-only in middleware, so
  // we can't pass it to getIronSession (which needs write access for sealing).
  const cookieValue = request.cookies.get(sessionOptions.cookieName)?.value
  let isLoggedIn = false

  if (cookieValue && sessionOptions.password) {
    try {
      const session = await unsealData<SessionData>(cookieValue, {
        password: sessionOptions.password as string,
      })
      isLoggedIn = session.isLoggedIn === true
    } catch {
      // Tampered or expired cookie — treat as unauthenticated
    }
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
