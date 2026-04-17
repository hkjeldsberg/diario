import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { WordEntry, WordVariant } from '@/lib/types'

export async function GET() {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const [{ data: entries, error: eErr }, { data: variants, error: vErr }] = await Promise.all([
    supabaseAdmin.from('word_entries').select('*').order('first_heard_at', { ascending: true }),
    supabaseAdmin.from('word_variants').select('*').order('recorded_at', { ascending: true }),
  ])

  if (eErr || vErr) {
    console.error('Failed to fetch words:', eErr ?? vErr)
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 })
  }

  const words = ((entries ?? []) as WordEntry[]).map((e) => ({
    ...e,
    variants: ((variants ?? []) as WordVariant[]).filter((v) => v.word_entry_id === e.id),
  }))

  return NextResponse.json(words)
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { base_word?: string; real_word?: string; first_heard_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { base_word, real_word, first_heard_at } = body
  if (!base_word?.trim()) {
    return NextResponse.json({ error: 'base_word is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('word_entries')
    .insert({
      base_word: base_word.trim(),
      real_word: real_word?.trim() || null,
      first_heard_at: first_heard_at || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create word:', error)
    return NextResponse.json({ error: 'Failed to create word' }, { status: 500 })
  }

  return NextResponse.json({ ...data, variants: [] }, { status: 201 })
}
