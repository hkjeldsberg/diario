export interface Entry {
  id: string
  date: string  // ISO date string e.g. "2024-03-15"
  text: string | null
  media_urls: string[]
  created_at: string
}

export interface WordEntry {
  id: string
  base_word: string
  first_heard_at: string
  created_at: string
  real_word: string | null
  variants?: WordVariant[]
}

export interface WordVariant {
  id: string
  word_entry_id: string
  variant: string
  recorded_at: string
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
