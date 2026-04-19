import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { data, error } = await supabaseAdmin
    .from('letters')
    .select('*')
    .order('written_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch letters:', error)
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { title?: string; content?: string; written_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, content, written_at } = body
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('letters')
    .insert({
      title: title.trim(),
      content: content ?? '',
      written_at: written_at || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create letter:', error)
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
