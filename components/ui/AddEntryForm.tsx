'use client'

import { useState, useRef } from 'react'
import { Entry } from '@/lib/types'

interface AddEntryFormProps {
  tabKey: string
  minDate: string  // ISO date string e.g. "2024-03-15"
  maxDate: string
  onSuccess: (newEntry: Entry) => void
}

export default function AddEntryForm({ tabKey, minDate, maxDate, onSuccess }: AddEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(minDate)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pickerPolling, setPickerPolling] = useState(false)
  const [pickerSessionId, setPickerSessionId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setError('')

    const urls: string[] = []
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Opplasting feilet')
        setUploading(false)
        return
      }
      const data = await res.json()
      urls.push(data.url)
    }

    setMediaUrls((prev) => [...prev, ...urls])
    setUploading(false)
    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handlePickerImport() {
    const res = await fetch('/api/photos/picker/create', { method: 'POST' })
    if (!res.ok) {
      // 501 = not configured, silently ignore; other errors show message
      if (res.status !== 501) {
        setError('Google Photos er ikke tilgjengelig')
      }
      return
    }

    const { sessionId, pickerUri } = await res.json()
    setPickerSessionId(sessionId)
    setPickerPolling(true)

    // Open picker in new tab
    window.open(pickerUri, '_blank', 'noopener')

    // Poll every 3 seconds for up to 5 minutes
    const POLL_INTERVAL = 3000
    const TIMEOUT = 5 * 60 * 1000
    const startTime = Date.now()

    const poll = async () => {
      if (Date.now() - startTime > TIMEOUT) {
        setPickerPolling(false)
        setPickerSessionId(null)
        setError('Tidsavbrudd for Google Photos-valg')
        return
      }

      const pollRes = await fetch(`/api/photos/picker/${sessionId}`)
      if (!pollRes.ok) {
        setPickerPolling(false)
        return
      }

      const data = await pollRes.json()
      if (data.ready) {
        setPickerPolling(false)
        setPickerSessionId(null)
        if (data.urls && data.urls.length > 0) {
          setMediaUrls((prev) => [...prev, ...data.urls])
        }
      } else {
        setTimeout(poll, POLL_INTERVAL)
      }
    }

    setTimeout(poll, POLL_INTERVAL)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && mediaUrls.length === 0) {
      setError('Legg til tekst eller bilder')
      return
    }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, text, media_urls: mediaUrls }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Noe gikk galt')
      setSubmitting(false)
      return
    }

    const newEntry: Entry = await res.json()
    onSuccess(newEntry)
    // Reset form
    setOpen(false)
    setText('')
    setMediaUrls([])
    setDate(minDate)
    setSubmitting(false)
  }

  return (
    <div className="mt-8">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-cream rounded-full font-body text-sm hover:bg-terracotta/90 transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Legg til minne
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-dusty-rose/30 p-6 max-w-lg">
          <h3 className="font-display text-xl text-stone-800 mb-4">Nytt minne</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date picker */}
            <div>
              <label className="block font-body text-sm text-stone-600 mb-1">Dato</label>
              <input
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-cream-dark rounded-lg px-3 py-2 font-body text-stone-800 bg-cream/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50"
                required
              />
            </div>

            {/* Text area */}
            <div>
              <label className="block font-body text-sm text-stone-600 mb-1">Tekst</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Skriv om dette øyeblikket..."
                className="w-full border border-cream-dark rounded-lg px-3 py-2 font-body text-stone-800 bg-cream/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 resize-none"
              />
            </div>

            {/* File upload */}
            <div>
              <label className="block font-body text-sm text-stone-600 mb-1">Bilder / video</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="block w-full font-body text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-sage/20 file:text-sage file:font-body file:text-sm hover:file:bg-sage/30"
              />
              {uploading && (
                <p className="text-sm font-body text-stone-400 mt-1">Laster opp...</p>
              )}
              {mediaUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-cream-dark">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 bg-white/80 rounded-full w-4 h-4 text-xs leading-none text-stone-600 hover:text-red-500 flex items-center justify-center"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Photos Picker */}
            <div>
              {pickerPolling ? (
                <p className="text-sm font-body text-stone-400 flex items-center gap-2">
                  <span className="animate-pulse">•</span>
                  Venter på valg i Google Photos...
                  <button
                    type="button"
                    onClick={() => { setPickerPolling(false); setPickerSessionId(null) }}
                    className="text-terracotta underline"
                  >
                    Avbryt
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handlePickerImport}
                  disabled={uploading || submitting}
                  className="text-sm font-body text-sage hover:text-sage/70 underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  Importer fra Google Photos
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-body text-terracotta" role="alert">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-5 py-2 bg-terracotta text-cream rounded-full font-body text-sm hover:bg-terracotta/90 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Lagrer...' : 'Lagre'}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(''); }}
                className="px-5 py-2 text-stone-500 font-body text-sm hover:text-stone-700 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
