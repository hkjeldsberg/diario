import { OAuth2Client } from 'google-auth-library'

const PICKER_BASE_URL = 'https://photospicker.googleapis.com/v1'

function getPickerAuth(): OAuth2Client {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID_PHOTOS,
    process.env.GOOGLE_CLIENT_SECRET_PHOTOS
  )
  client.setCredentials({ refresh_token: process.env.GOOGLE_PICKER_REFRESH_TOKEN })
  return client
}

export async function getAccessToken(): Promise<string> {
  const client = getPickerAuth()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to get Google Photos Picker access token')
  return token
}

export async function createPickerSession(): Promise<{ id: string; pickerUri: string }> {
  const token = await getAccessToken()

  const res = await fetch(`${PICKER_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create picker session: ${res.status} ${body}`)
  }

  const data = await res.json()
  return { id: data.id, pickerUri: data.pickerUri }
}

export interface PickerSessionStatus {
  ready: boolean
  mediaItems?: PickerMediaItem[]
}

interface PickerMediaItem {
  id: string
  mediaFile: {
    baseUrl: string
    mimeType: string
    filename: string
  }
}

export async function pollPickerSession(sessionId: string): Promise<PickerSessionStatus> {
  const token = await getAccessToken()

  const res = await fetch(`${PICKER_BASE_URL}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to poll picker session: ${res.status}`)
  }

  const data = await res.json()

  if (!data.mediaItemsSet) {
    return { ready: false }
  }

  // Fetch media items
  let allItems: PickerMediaItem[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({ sessionId })
    if (pageToken) params.set('pageToken', pageToken)

    const itemsRes = await fetch(`${PICKER_BASE_URL}/mediaItems?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!itemsRes.ok) {
      throw new Error(`Failed to fetch media items: ${itemsRes.status}`)
    }

    const itemsData = await itemsRes.json()
    allItems = allItems.concat(itemsData.mediaItems ?? [])
    pageToken = itemsData.nextPageToken
  } while (pageToken)

  return { ready: true, mediaItems: allItems }
}

export async function deletePickerSession(sessionId: string): Promise<void> {
  try {
    const token = await getAccessToken()
    await fetch(`${PICKER_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.warn('Failed to delete picker session:', err)
  }
}

export function isPickerConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID_PHOTOS &&
    process.env.GOOGLE_CLIENT_SECRET_PHOTOS &&
    process.env.GOOGLE_PICKER_REFRESH_TOKEN
  )
}
