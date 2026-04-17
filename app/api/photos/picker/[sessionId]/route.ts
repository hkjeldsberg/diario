import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { pollPickerSession, deletePickerSession, isPickerConfigured, getAccessToken } from '@/lib/google-picker'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authCheck = await requireAuth()
  if (authCheck) return authCheck

  if (!isPickerConfigured()) {
    return NextResponse.json({ error: 'Google Photos Picker not configured' }, { status: 501 })
  }

  const { sessionId } = params

  try {
    const status = await pollPickerSession(sessionId)

    if (!status.ready) {
      return NextResponse.json({ ready: false })
    }

    // Download each photo and re-upload to Supabase Storage
    const token = await getAccessToken()
    const urls: string[] = []

    for (const item of status.mediaItems ?? []) {
      try {
        const downloadUrl = `${item.mediaFile.baseUrl}=d`
        const photoRes = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!photoRes.ok) {
          console.error(`Failed to download picker photo: ${photoRes.status} ${await photoRes.text()}`)
          continue
        }

        const rawBuffer = await photoRes.arrayBuffer()
        const isImage = item.mediaFile.mimeType?.startsWith('image/')
        const compressed = isImage
          ? await sharp(Buffer.from(rawBuffer))
              .resize({ width: 2000, withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toBuffer()
          : Buffer.from(rawBuffer)
        const contentType = isImage ? 'image/jpeg' : item.mediaFile.mimeType
        const ext = isImage ? 'jpg' : (item.mediaFile.filename.split('.').pop() ?? 'jpg')
        const filename = `picker/${randomUUID()}.${ext}`

        const { data, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(filename, compressed, {
            contentType,
            upsert: false,
          })

        if (error) {
          console.error('Failed to upload picker photo:', error)
          continue
        }

        const { data: urlData } = supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(data.path)

        urls.push(urlData.publicUrl)
      } catch (err) {
        console.warn('Failed to process picker item:', err)
      }
    }

    // Clean up the picker session
    await deletePickerSession(sessionId)

    return NextResponse.json({ ready: true, urls })
  } catch (err) {
    console.error('Picker poll error:', err)
    return NextResponse.json({ error: 'Failed to poll picker session' }, { status: 503 })
  }
}
