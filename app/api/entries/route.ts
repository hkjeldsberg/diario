import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TAB_DEFINITIONS, getBirthDate, formatDateToISO } from '@/lib/tabs'
import { Entry } from '@/lib/types'

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { searchParams } = new URL(request.url)
  const tabKey = searchParams.get('tab')

  if (!tabKey) {
    return NextResponse.json({ error: 'tab parameter is required' }, { status: 400 })
  }

  const tab = TAB_DEFINITIONS.find((t) => t.key === tabKey)
  if (!tab || !tab.getDateRange) {
    return NextResponse.json({ error: 'Invalid tab key' }, { status: 400 })
  }

  let birthDate: Date
  try {
    birthDate = getBirthDate()
  } catch (err) {
    return NextResponse.json({ error: 'BIRTH_DATE not configured' }, { status: 500 })
  }

  const { from, to } = tab.getDateRange(birthDate)
  const fromStr = formatDateToISO(from)
  const toStr = formatDateToISO(to)

  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('*')
    .gte('date', fromStr)
    .lte('date', toStr)
    .order('date', { ascending: true })

  if (error) {
    console.error('Failed to fetch entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }

  return NextResponse.json(data as Entry[])
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { date?: string; text?: string; media_urls?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { date, text, media_urls = [] } = body

  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  if (!text?.trim() && (!media_urls || media_urls.length === 0)) {
    return NextResponse.json({ error: 'Entry must have text or media' }, { status: 400 })
  }

  // Validate date falls within a known diary tab range
  let birthDate: Date
  try {
    birthDate = getBirthDate()
  } catch {
    return NextResponse.json({ error: 'BIRTH_DATE not configured' }, { status: 500 })
  }

  const entryDate = new Date(date)
  const diaryTabs = TAB_DEFINITIONS.filter((t) => t.getDateRange)
  const isInRange = diaryTabs.some((tab) => {
    const { from, to } = tab.getDateRange!(birthDate)
    return entryDate >= from && entryDate <= to
  })

  if (!isInRange) {
    return NextResponse.json(
      { error: 'Date is outside all diary tab ranges' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('entries')
    .insert({ date, text: text?.trim() || null, media_urls })
    .select()
    .single()

  if (error) {
    console.error('Failed to create entry:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }

  return NextResponse.json(data as Entry, { status: 201 })
}
