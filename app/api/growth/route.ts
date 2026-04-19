import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  const { data, error } = await supabaseAdmin
    .from('growth_records')
    .select('*')
    .order('recorded_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch growth records:', error)
    return NextResponse.json({ error: 'Failed to fetch growth records' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let body: { recorded_at?: string; weight_kg?: number | null; height_cm?: number | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { recorded_at, weight_kg, height_cm } = body
  if (!weight_kg && !height_cm) {
    return NextResponse.json({ error: 'weight_kg or height_cm is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('growth_records')
    .insert({
      recorded_at: recorded_at || new Date().toISOString().split('T')[0],
      weight_kg: weight_kg ?? null,
      height_cm: height_cm ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create growth record:', error)
    return NextResponse.json({ error: 'Failed to create growth record' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
