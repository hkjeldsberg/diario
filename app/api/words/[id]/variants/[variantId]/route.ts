import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { variant?: string; recorded_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.variant !== undefined) updates.variant = body.variant.trim()
  if (body.recorded_at !== undefined) updates.recorded_at = body.recorded_at

  const { data, error } = await supabaseAdmin
    .from('word_variants')
    .update(updates)
    .eq('id', params.variantId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update variant:', error)
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { variantId: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { error } = await supabaseAdmin
    .from('word_variants')
    .delete()
    .eq('id', params.variantId)

  if (error) {
    console.error('Failed to delete variant:', error)
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
