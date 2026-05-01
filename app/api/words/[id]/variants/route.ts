import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { variant?: string; recorded_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { variant, recorded_at } = body
  if (!variant?.trim()) {
    return NextResponse.json({ error: 'variant is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('word_variants')
    .insert({
      word_entry_id: params.id,
      variant: variant.trim(),
      recorded_at: recorded_at || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create variant:', error)
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
