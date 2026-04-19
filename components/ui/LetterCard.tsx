'use client'

import { useEffect, useRef, useState } from 'react'
import { Letter } from '@/lib/types'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

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

interface LetterCardProps {
  letter: Letter
  isAuthenticated: boolean
  onUpdate: (updated: Letter) => void
  onDelete: (id: string) => void
}

export default function LetterCard({ letter, isAuthenticated, onUpdate, onDelete }: LetterCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: letter.title, content: letter.content, written_at: letter.written_at })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/letters/${letter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const updated: Letter = await res.json()
      onUpdate(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/letters/${letter.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(letter.id)
  }

  if (editing) {
    return (
      <article className="bg-white rounded-2xl border border-dusty-rose/30 shadow-sm mb-4 overflow-hidden p-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
            />
          </div>
          <input
            type="date"
            value={form.written_at}
            onChange={(e) => setForm((f) => ({ ...f, written_at: e.target.value }))}
            className="border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
          />
        </div>
        <RichEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-body text-sm px-5 py-2 bg-terracotta text-cream rounded-lg hover:bg-terracotta/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="font-body text-sm px-5 py-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            Avbryt
          </button>
        </div>
      </article>
    )
  }

  return (
    <article
      className="bg-white rounded-2xl border border-dusty-rose/30 shadow-sm mb-4 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => !editing && setExpanded((p) => !p)}
    >
      <div className="flex items-start gap-4 p-5">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-terracotta/15 flex items-center justify-center">
          <span className="font-handwritten text-terracotta text-lg">✉</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-body font-medium text-stone-800 truncate">Fødebrev</p>
            <time className="font-handwritten text-stone-400 text-sm flex-shrink-0">{fmtDate(letter.written_at)}</time>
          </div>
          <p className="font-body text-stone-700 text-sm mt-0.5 font-medium">{letter.title}</p>
          {!expanded && (
            <p
              className="font-body text-stone-400 text-sm mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: letter.content }}
            />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-cream-dark" onClick={(e) => e.stopPropagation()}>
          <div
            className="mt-4 font-normal text-stone-700 text-sm leading-relaxed [&_*]:!text-sm [&_*]:!font-[inherit] [&_p]:my-1"
            dangerouslySetInnerHTML={{ __html: letter.content }}
          />
          {isAuthenticated && (
            <div className="flex gap-3 mt-4 pt-3 border-t border-dusty-rose/20">
              <button
                onClick={() => setEditing(true)}
                className="font-body text-xs text-stone-400 hover:text-terracotta transition-colors"
              >
                Rediger
              </button>
              <button
                onClick={handleDelete}
                className="font-body text-xs text-stone-400 hover:text-red-400 transition-colors"
              >
                Slett
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
