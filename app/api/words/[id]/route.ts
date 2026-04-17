import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { base_word?: string; real_word?: string; first_heard_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.base_word !== undefined) updates.base_word = body.base_word.trim()
  if (body.real_word !== undefined) updates.real_word = body.real_word?.trim() || null
  if (body.first_heard_at !== undefined) updates.first_heard_at = body.first_heard_at

  const { data, error } = await supabaseAdmin
    .from('word_entries')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update word:', error)
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { error } = await supabaseAdmin
    .from('word_entries')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('Failed to delete word:', error)
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
