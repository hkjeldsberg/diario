import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// Magic byte signatures for allowed file types
const MAGIC_BYTES: { sig: number[]; offset?: number; ext: string }[] = [
  { sig: [0xff, 0xd8, 0xff], ext: 'jpg' },                          // JPEG
  { sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ext: 'png' }, // PNG
  { sig: [0x47, 0x49, 0x46], ext: 'gif' },                           // GIF
  { sig: [0x66, 0x74, 0x79, 0x70], offset: 4, ext: 'mp4' },          // MP4
  { sig: [0x6d, 0x6f, 0x6f, 0x76], offset: 4, ext: 'mov' },          // MOV
  { sig: [0x52, 0x49, 0x46, 0x46], ext: 'webp' },                    // RIFF (WebP)
]

function detectMimeType(buffer: Uint8Array): { ext: string; mime: string } | null {
  for (const { sig, offset = 0, ext } of MAGIC_BYTES) {
    const matches = sig.every((byte, i) => buffer[offset + i] === byte)
    if (matches) {
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        webp: 'image/webp',
      }
      return { ext, mime: mimeMap[ext] }
    }
  }
  return null
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 413 })
  }

  // Read file bytes for magic byte inspection
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // Validate via magic bytes (not client-supplied Content-Type)
  const detected = detectMimeType(bytes)
  if (!detected) {
    return NextResponse.json(
      { error: 'File type not allowed. Only JPEG, PNG, GIF, MP4, MOV, and WebP are accepted.' },
      { status: 400 }
    )
  }

  // Generate UUID filename — never use the original filename (path traversal, XSS via filename)
  const filename = `${randomUUID()}.${detected.ext}`

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filename, bytes, {
      contentType: detected.mime,
      upsert: false,
    })

  if (error) {
    console.error('Supabase Storage upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl })
}
