'use client'

import { useEffect, useRef, useState } from 'react'
import { EmailMessage, Letter } from '@/lib/types'
import EmailCard from './EmailCard'
import LetterCard from './LetterCard'

interface PostboksContentProps {
  emails: EmailMessage[]
  initialLetters: Letter[]
  isAuthenticated: boolean
  emailError?: string
}

type FeedItem =
  | { kind: 'email'; date: Date; item: EmailMessage }
  | { kind: 'letter'; date: Date; item: Letter }

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="px-2 py-1 rounded text-sm text-stone-600 hover:bg-dusty-rose/20 hover:text-terracotta transition-colors"
    >
      {children}
    </button>
  )
}

function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.innerHTML = value }, [])
  function exec(command: string) { document.execCommand(command, false); ref.current?.focus() }
  return (
    <div className="border border-dusty-rose/40 rounded-lg overflow-hidden focus-within:border-terracotta/60 transition-colors">
      <div className="flex gap-1 px-2 py-1.5 border-b border-dusty-rose/30 bg-cream/60">
        <ToolbarButton onClick={() => exec('bold')} title="Fet"><strong>B</strong></ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="Kursiv"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => exec('underline')} title="Understrek"><span className="underline">U</span></ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        data-placeholder={placeholder}
        className="min-h-[160px] px-4 py-3 font-body font-normal text-stone-700 text-sm leading-relaxed outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-stone-400 [&:empty]:before:pointer-events-none"
      />
    </div>
  )
}

export default function PostboksContent({ emails, initialLetters, isAuthenticated, emailError }: PostboksContentProps) {
  const [letters, setLetters] = useState<Letter[]>(initialLetters)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', written_at: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const feed: FeedItem[] = [
    ...emails.map((e) => ({ kind: 'email' as const, date: new Date(e.date), item: e })),
    ...letters.map((l) => ({ kind: 'letter' as const, date: new Date(l.written_at), item: l })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const created: Letter = await res.json()
      setLetters((prev) => [created, ...prev])
      setForm({ title: '', content: '', written_at: new Date().toISOString().split('T')[0] })
      setAdding(false)
    } catch {
      setError('Kunne ikke lagre brevet')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-stone-800 mb-2">Postboks</h2>
          <p className="font-handwritten text-sage text-xl">Brev til deg</p>
        </div>
        {isAuthenticated && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="font-body text-sm text-terracotta hover:text-terracotta/70 transition-colors"
          >
            + Nytt brev
          </button>
        )}
      </div>

      {emailError && (
        <p className="font-body text-stone-400 text-sm mb-4 italic">(Gmail-feil: {emailError})</p>
      )}

      {error && (
        <p className="font-body text-sm text-red-500 mb-4">{error}</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mb-6 bg-white rounded-2xl border border-dusty-rose/30 shadow-sm p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Tittel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Kjære Sofia…"
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
              />
            </div>
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Dato</label>
              <input
                type="date"
                value={form.written_at}
                onChange={(e) => setForm((f) => ({ ...f, written_at: e.target.value }))}
                className="border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
              />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Innhold</label>
            <RichEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="Skriv brevet her…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="font-body text-sm px-5 py-2 bg-terracotta text-cream rounded-lg hover:bg-terracotta/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Lagrer…' : 'Lagre brev'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setError('') }}
              className="font-body text-sm px-5 py-2 text-stone-500 hover:text-stone-700 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {feed.length === 0 && !adding && (
        <p className="font-body text-stone-400 text-sm italic text-center mt-16">Ingen meldinger ennå.</p>
      )}

      {feed.map((entry) =>
        entry.kind === 'email' ? (
          <EmailCard key={`email-${entry.item.id}`} email={entry.item} />
        ) : (
          <LetterCard
            key={`letter-${entry.item.id}`}
            letter={entry.item}
            isAuthenticated={isAuthenticated}
            onUpdate={(updated) => setLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))}
            onDelete={(id) => setLetters((prev) => prev.filter((l) => l.id !== id))}
          />
        )
      )}
    </div>
  )
}
