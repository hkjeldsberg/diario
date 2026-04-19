import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { title?: string; content?: string; written_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content
  if (body.written_at !== undefined) updates.written_at = body.written_at

  const { data, error } = await supabaseAdmin
    .from('letters')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update letter:', error)
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 })
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
    .from('letters')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('Failed to delete letter:', error)
    return NextResponse.json({ error: 'Failed to delete letter' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
