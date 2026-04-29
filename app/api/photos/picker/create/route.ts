import { NextResponse } from 'next/server'
import { requireAuth, getSession } from '@/lib/auth'
import { createPickerSession, isPickerConfigured } from '@/lib/google-picker'

export async function POST() {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  if (!isPickerConfigured()) {
    return NextResponse.json(
      { error: 'Google Photos Picker is not configured' },
      { status: 501 }
    )
  }

  const session = await getSession()

  try {
    const { id, pickerUri } = await createPickerSession(session.userId)
    return NextResponse.json({ sessionId: id, pickerUri })
  } catch (err) {
    console.error('Failed to create picker session:', err)
    return NextResponse.json({ error: 'Failed to create picker session' }, { status: 503 })
  }
}
