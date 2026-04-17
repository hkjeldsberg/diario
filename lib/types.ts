export interface Entry {
  id: string
  date: string  // ISO date string e.g. "2024-03-15"
  text: string | null
  media_urls: string[]
  created_at: string
}

export interface EmailMessage {
  id: string
  from: string
  subject: string
  date: string
  snippet: string
  body: string
  isHtml: boolean
  attachmentUrls?: string[]
}
