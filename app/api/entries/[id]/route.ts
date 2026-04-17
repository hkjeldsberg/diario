import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Entry } from '@/lib/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { id } = params

  let body: { media_urls?: string[]; text?: string; date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Partial<Entry> = {}
  if (body.media_urls !== undefined) updates.media_urls = body.media_urls
  if (body.text !== undefined) updates.text = body.text
  if (body.date !== undefined) updates.date = body.date

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update entry:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }

  return NextResponse.json(data as Entry)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { id } = params

  const { error } = await supabaseAdmin
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
