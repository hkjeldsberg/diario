import { google } from 'googleapis'
import { EmailMessage } from './types'

function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return google.gmail({ version: 'v1', auth })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): { body: string; isHtml: boolean } {
  // First part is the message body; remaining parts are attachments.
  const textPart = payload.parts?.[0] ?? payload
  const data: string = textPart.body?.data ?? ''
  const body = data ? Buffer.from(data, 'base64url').toString('utf-8') : ''
  const isHtml = (textPart.mimeType ?? '') === 'text/html'
  return { body, isHtml }
}

function getHeader(headers: { name?: string | null; value?: string | null }[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

async function extractImageAttachments(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<string[]> {
  const urls: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function walk(p: any) {
    if (!p) return
    if (typeof p.mimeType === 'string' && p.mimeType.startsWith('image/')) {
      if (p.body?.data) {
        // Inline image — convert base64url to data URI
        const b64 = (p.body.data as string).replace(/-/g, '+').replace(/_/g, '/')
        urls.push(`data:${p.mimeType};base64,${b64}`)
      } else if (p.body?.attachmentId) {
        // Attached image — fetch separately
        try {
          const res = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId,
            id: p.body.attachmentId,
          })
          if (res.data.data) {
            const b64 = (res.data.data as string).replace(/-/g, '+').replace(/_/g, '/')
            urls.push(`data:${p.mimeType};base64,${b64}`)
          }
        } catch (e) {
          console.warn('Failed to fetch attachment:', e)
        }
      }
    }
    if (Array.isArray(p.parts)) {
      for (const part of p.parts) await walk(part)
    }
  }

  await walk(payload)
  return urls
}

export async function fetchEmails(): Promise<EmailMessage[]> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    return []
  }

  const toAddress = process.env.GMAIL_TO_ADDRESS
  if (!toAddress) return []

  try {
    const gmail = getGmailClient()

    // Step 1: List message IDs
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${toAddress}`,
      maxResults: 50,
    })

    const messageIds = listRes.data.messages ?? []
    if (messageIds.length === 0) return []

    // Step 2: Fetch each message in full
    const emails: EmailMessage[] = []

    for (const { id } of messageIds) {
      if (!id) continue
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        })

        const msg = msgRes.data
        const headers = msg.payload?.headers ?? []

        // Skip automated Google emails
        const from = getHeader(headers, 'from')
        if (from.includes('@google.com') || from.includes('@accounts.google.com')) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { body, isHtml } = extractBody(msg.payload as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attachmentUrls = await extractImageAttachments(gmail, id, msg.payload as any)

        emails.push({
          id,
          from,
          subject: getHeader(headers, 'subject') || '(ingen emne)',
          date: getHeader(headers, 'date'),
          snippet: msg.snippet ?? '',
          body,
          isHtml,
          attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        })
      } catch (err) {
        console.warn(`Failed to fetch message ${id}:`, err)
      }
    }

    return emails
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number }
    if (error?.message?.includes('invalid_grant') || error?.code === 401) {
      console.warn('Gmail refresh token expired or invalid — returning empty inbox')
      return []
    }
    throw err
  }
}
