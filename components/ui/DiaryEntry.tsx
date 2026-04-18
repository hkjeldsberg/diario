'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Entry } from '@/lib/types'
import { compressImage } from '@/lib/compressImage'

interface DiaryEntryProps {
  entry: Entry
  isAuthenticated?: boolean
  onUpdate?: (updated: Entry) => void
  onDelete?: (id: string) => void
  index?: number
}

export default function DiaryEntry({ entry, isAuthenticated, onUpdate, onDelete, index = 0 }: DiaryEntryProps) {
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit-mode state
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(entry.text ?? '')
  const [saving, setSaving] = useState(false)

  // Date edit state
  const [editingDate, setEditingDate] = useState(false)
  const [editDateValue, setEditDateValue] = useState(entry.date)
  const [savingDate, setSavingDate] = useState(false)

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Picker state
  const [pickerPolling, setPickerPolling] = useState(false)

  // Hovered image index for uncropped zoom
  const [hoveredImgIndex, setHoveredImgIndex] = useState<number | null>(null)

  const formattedDate = new Date(entry.date).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploadProgress({ current: 0, total: files.length })
    setError('')

    const newUrls: string[] = []

    for (let idx = 0; idx < files.length; idx++) {
      setUploadProgress({ current: idx + 1, total: files.length })
      const file = await compressImage(files[idx])
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Opplasting feilet')
        setUploadProgress(null)
        return
      }
      const data = await res.json()
      newUrls.push(data.url)
    }

    // Append new URLs to existing ones and PATCH the entry
    const updatedUrls = [...(entry.media_urls ?? []), ...newUrls]

    const patchRes = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_urls: updatedUrls }),
    })

    if (!patchRes.ok) {
      setError('Kunne ikke lagre bilder')
      setUploadProgress(null)
      return
    }

    const updated: Entry = await patchRes.json()
    onUpdate?.(updated)

    setUploadProgress(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDateClick() {
    if (!isAuthenticated) return
    setEditDateValue(entry.date)
    setEditingDate(true)
  }

  async function handleDateSave() {
    setSavingDate(true)
    const patchRes = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: editDateValue }),
    })
    if (!patchRes.ok) {
      setError('Kunne ikke lagre dato')
      setSavingDate(false)
      return
    }
    const updated: Entry = await patchRes.json()
    onUpdate?.(updated)
    setSavingDate(false)
    setEditingDate(false)
  }

  function handleDateCancel() {
    setEditingDate(false)
  }

  function handleEditClick() {
    setEditText(entry.text ?? '')
    setEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSaveEdit() {
    setSaving(true)
    setError('')

    const patchRes = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText }),
    })

    if (!patchRes.ok) {
      setError('Kunne ikke lagre tekst')
      setSaving(false)
      return
    }

    const updated: Entry = await patchRes.json()
    onUpdate?.(updated)
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Kunne ikke slette innlegget')
      setDeleting(false)
      setConfirmDelete(false)
      return
    }
    onDelete?.(entry.id)
  }

  async function handleRemoveImage(index: number) {
    const updatedUrls = (entry.media_urls ?? []).filter((_, i) => i !== index)
    const patchRes = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_urls: updatedUrls }),
    })
    if (patchRes.ok) onUpdate?.(await patchRes.json())
    else setError('Kunne ikke slette bildet')
  }

  async function handlePickerImport() {
    const res = await fetch('/api/photos/picker/create', { method: 'POST' })
    if (!res.ok) return
    const { sessionId, pickerUri } = await res.json()
    setPickerPolling(true)
    window.open(pickerUri, '_blank', 'noopener')

    const POLL_INTERVAL = 3000
    const TIMEOUT = 5 * 60 * 1000
    const startTime = Date.now()

    const poll = async () => {
      if (Date.now() - startTime > TIMEOUT) { setPickerPolling(false); return }
      const pollRes = await fetch(`/api/photos/picker/${sessionId}`)
      if (!pollRes.ok) { setPickerPolling(false); return }
      const data = await pollRes.json()
      if (data.ready) {
        setPickerPolling(false)
        if (!data.urls?.length) return
        const updatedUrls = [...(entry.media_urls ?? []), ...data.urls]
        const patchRes = await fetch(`/api/entries/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media_urls: updatedUrls }),
        })
        if (patchRes.ok) onUpdate?.(await patchRes.json())
        else setError('Kunne ikke lagre bilder')
      } else {
        setTimeout(poll, POLL_INTERVAL)
      }
    }
    setTimeout(poll, POLL_INTERVAL)
  }

  const hasImages = (entry.media_urls?.length ?? 0) > 0
  const isOdd = index % 2 === 1

  // Text content block (display or edit mode)
  const textBlock = (
    <div className="flex-1">
      {editing ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="font-body text-stone-700 leading-relaxed w-full border border-dusty-rose/40 rounded-lg p-3 resize-none min-h-[120px] focus:outline-none focus:ring-1 focus:ring-terracotta/40"
          />
          <div className="flex items-center gap-2 mt-2">
            {saving && (
              <span className="font-body text-xs text-stone-400">Lagrer...</span>
            )}
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="text-xs font-body bg-terracotta text-white px-3 py-1 rounded-lg hover:bg-terracotta/80 disabled:opacity-50"
            >
              Lagre
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="text-xs font-body text-stone-500 hover:text-stone-700 px-2 py-1 disabled:opacity-50"
            >
              Avbryt
            </button>
          </div>
        </>
      ) : (
        entry.text && (
          <p className="font-pappa text-2xl text-stone-700 leading-relaxed whitespace-pre-wrap mb-3">
            {entry.text}
          </p>
        )
      )}
    </div>
  )

  // Side images block — polaroid grid (2-col when 2+ images, 1-col for single)
  const imagesBlock = hasImages ? (
    <div className="md:w-2/5 md:flex-shrink-0 overflow-visible">
      <div className="grid grid-cols-2 gap-3 overflow-visible">
        {entry.media_urls!.map((url, i) => {
          const rot = ((i % 5) - 2) * 2.5
          return (
            <motion.div
              key={i}
              className="relative group/img bg-white p-2 pb-7 shadow-md cursor-pointer select-none"
              initial={{ rotate: 0, opacity: 0, y: -8 }}
              animate={{ rotate: rot, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 12, delay: i * 0.06, opacity: { duration: 0.3 } }}
              whileHover={{ scale: 2, zIndex: 50, rotate: 0, transition: { type: 'spring', stiffness: 150, damping: 20 } }}
              style={{ willChange: 'transform', transformOrigin: 'center center' }}
              onHoverStart={() => setHoveredImgIndex(i)}
              onHoverEnd={() => setHoveredImgIndex(null)}
            >
              <div className="relative w-full aspect-square overflow-hidden bg-white">
                <Image
                  src={url}
                  alt={`Bilde ${i + 1} fra ${formattedDate}`}
                  fill
                  className={`transition-all duration-200 ${hoveredImgIndex === i ? 'object-contain' : 'object-cover'}`}
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(i) }}
                  className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-xs text-stone-400 hover:text-red-500 shadow-sm z-10"
                >✕</button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <article className="mb-8 group">
      {/* Date + action buttons — always full width */}
      <div className="flex items-baseline justify-between mb-2">
        {editingDate ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={editDateValue}
              onChange={(e) => setEditDateValue(e.target.value)}
              className="font-handwritten text-terracotta text-lg bg-transparent border-b border-terracotta/40 outline-none"
              disabled={savingDate}
              autoFocus
            />
            <button
              type="button"
              onClick={handleDateSave}
              disabled={savingDate}
              className="text-xs font-body bg-terracotta text-white px-2 py-0.5 rounded disabled:opacity-50"
            >
              {savingDate ? '...' : 'OK'}
            </button>
            <button
              type="button"
              onClick={handleDateCancel}
              disabled={savingDate}
              className="text-xs font-body text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <time
            dateTime={entry.date}
            className={`font-handwritten text-terracotta text-lg${isAuthenticated ? ' cursor-pointer hover:underline decoration-dotted' : ''}`}
            onClick={handleDateClick}
          >
            {formattedDate}
          </time>
        )}

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {uploadProgress !== null && (
              <span className="font-body text-xs text-stone-400">
                {uploadProgress.current}/{uploadProgress.total}
              </span>
            )}
            {!editing && (
              <button
                type="button"
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-body text-sage hover:text-sage/70"
                title="Rediger tekst"
              >
                Rediger
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadProgress !== null}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-body text-sage hover:text-sage/70 flex items-center gap-1 disabled:opacity-40"
              title="Legg til bilde"
            >
              <span className="text-base leading-none">+</span> Bilde
            </button>
            {pickerPolling ? (
              <span className="text-xs font-body text-stone-400 flex items-center gap-1">
                <span className="animate-pulse">•</span> Photos...
                <button type="button" onClick={() => setPickerPolling(false)} className="text-terracotta">✕</button>
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePickerImport}
                disabled={uploadProgress !== null}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-body text-sage hover:text-sage/70 disabled:opacity-40"
                title="Importer fra Google Photos"
              >
                Google Photos
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-body text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting ? '...' : 'Bekreft'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-xs font-body text-stone-400 hover:text-stone-600"
                >
                  Avbryt
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-body text-stone-400 hover:text-red-500"
                title="Slett innlegg"
              >
                Slett
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body: text first on mobile, two-column on desktop when images exist */}
      {hasImages ? (
        <div className={`flex flex-col gap-4 md:flex-row md:gap-6 md:items-start${isOdd ? ' md:flex-row-reverse' : ''}`}>
          {textBlock}
          {imagesBlock}
        </div>
      ) : (
        textBlock
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="mt-2">
          <p className="text-xs font-body text-stone-500 mb-1">
            Behandler {uploadProgress.current} av {uploadProgress.total}...
          </p>
          <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs font-body text-terracotta mb-2 mt-2" role="alert">{error}</p>
      )}

      {/* Divider */}
      <div className="mt-6 border-t border-dusty-rose/20" />
    </article>
  )
}
