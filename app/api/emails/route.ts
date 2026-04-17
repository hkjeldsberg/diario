import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchEmails } from '@/lib/gmail'

export async function GET() {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  try {
    const emails = await fetchEmails()
    return NextResponse.json({ emails })
  } catch (err) {
    console.error('Gmail API error:', err)
    return NextResponse.json({ emails: [], error: 'Gmail unavailable' })
  }
}
