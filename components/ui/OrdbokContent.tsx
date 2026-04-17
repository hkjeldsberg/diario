'use client'

import { useState } from 'react'
import { WordEntry, WordVariant } from '@/lib/types'

interface OrdbokContentProps {
  initialWords: WordEntry[]
  isAuthenticated: boolean
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' })
}

export default function OrdbokContent({ initialWords, isAuthenticated }: OrdbokContentProps) {
  const [words, setWords] = useState<WordEntry[]>(initialWords)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    base_word: '',
    real_word: '',
    first_heard_at: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateWordVariants(wordId: string, updatedVariant: WordVariant) {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId
          ? { ...w, variants: w.variants!.map((v) => (v.id === updatedVariant.id ? updatedVariant : v)) }
          : w
      )
    )
  }

  function deleteWordVariant(wordId: string, variantId: string) {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, variants: w.variants!.filter((v) => v.id !== variantId) } : w
      )
    )
  }

  async function handleDeleteWord(id: string) {
    const res = await fetch(`/api/words/${id}`, { method: 'DELETE' })
    if (res.ok) setWords((prev) => prev.filter((w) => w.id !== id))
    else setError('Kunne ikke slette ordet')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.base_word.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const newWord: WordEntry = await res.json()
      setWords((prev) =>
        [...prev, newWord].sort(
          (a, b) => new Date(a.first_heard_at).getTime() - new Date(b.first_heard_at).getTime()
        )
      )
      setForm({ base_word: '', real_word: '', first_heard_at: new Date().toISOString().split('T')[0] })
      setAdding(false)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Noe gikk galt')
    }
    setSaving(false)
  }

  return (
    <div className="relative">
      <h2 className="font-display text-3xl text-stone-800 mb-2">Din ordbok</h2>
      <p className="font-handwritten text-sage text-xl mb-2">Ordene dine venter...</p>
      <p className="font-body text-stone-400 text-sm mb-8">{words.length} ord lært</p>

      <div className="space-y-0">
        {words.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            isAuthenticated={isAuthenticated}
            onDeleteWord={handleDeleteWord}
            onVariantUpdate={updateWordVariants}
            onVariantDelete={deleteWordVariant}
          />
        ))}
        {words.length === 0 && (
          <p className="font-body text-stone-400 italic">Ingen ord enda...</p>
        )}
      </div>

      {error && <p className="text-xs font-body text-terracotta mt-4">{error}</p>}

      {isAuthenticated && (
        <div className="mt-8">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-cream rounded-full font-body text-sm hover:bg-terracotta/90 transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Legg til ord
            </button>
          ) : (
            <form
              onSubmit={handleAdd}
              className="bg-white rounded-2xl shadow-sm border border-dusty-rose/30 p-6 max-w-sm"
            >
              <h3 className="font-display text-lg text-stone-800 mb-4">Nytt ord</h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-xs text-stone-500 mb-1">Sofias ord</label>
                  <input
                    type="text"
                    value={form.base_word}
                    onChange={(e) => setForm((f) => ({ ...f, base_word: e.target.value }))}
                    placeholder="f.eks. Avo"
                    className="w-full border border-cream-dark rounded-lg px-3 py-1.5 font-body text-sm text-stone-800 bg-cream/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-stone-500 mb-1">Egentlig ord</label>
                  <input
                    type="text"
                    value={form.real_word}
                    onChange={(e) => setForm((f) => ({ ...f, real_word: e.target.value }))}
                    placeholder="f.eks. Avokado"
                    className="w-full border border-cream-dark rounded-lg px-3 py-1.5 font-body text-sm text-stone-800 bg-cream/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-stone-500 mb-1">Dato</label>
                  <input
                    type="date"
                    value={form.first_heard_at}
                    onChange={(e) => setForm((f) => ({ ...f, first_heard_at: e.target.value }))}
                    className="w-full border border-cream-dark rounded-lg px-3 py-1.5 font-body text-sm text-stone-800 bg-cream/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-terracotta text-cream rounded-full font-body text-sm hover:bg-terracotta/90 disabled:opacity-60"
                >
                  {saving ? 'Lagrer...' : 'Lagre'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setError('') }}
                  className="px-4 py-1.5 text-stone-500 font-body text-sm hover:text-stone-700"
                >
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="absolute -right-4 top-0 opacity-10 pointer-events-none hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/svgs/botanical-1.svg" alt="" className="w-32" />
      </div>
    </div>
  )
}

// ─── WordRow ──────────────────────────────────────────────────────────────────

type EditingCell = { id: string; field: 'variant' | 'recorded_at' } | null

function WordRow({
  word,
  isAuthenticated,
  onDeleteWord,
  onVariantUpdate,
  onVariantDelete,
}: {
  word: WordEntry
  isAuthenticated: boolean
  onDeleteWord: (id: string) => void
  onVariantUpdate: (wordId: string, v: WordVariant) => void
  onVariantDelete: (wordId: string, variantId: string) => void
}) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')

  const hasVariants = (word.variants?.length ?? 0) > 0
  const sortedVariants = hasVariants
    ? [...word.variants!].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      )
    : []

  function startEdit(id: string, field: 'variant' | 'recorded_at', current: string) {
    setEditingCell({ id, field })
    setEditValue(current)
  }

  async function commitEdit() {
    if (!editingCell) return
    const { id, field } = editingCell
    setEditingCell(null)
    const res = await fetch(`/api/words/${word.id}/variants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: editValue }),
    })
    if (res.ok) onVariantUpdate(word.id, await res.json())
  }

  async function handleDeleteVariant(variantId: string) {
    const res = await fetch(`/api/words/${word.id}/variants/${variantId}`, { method: 'DELETE' })
    if (res.ok) onVariantDelete(word.id, variantId)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') setEditingCell(null)
  }

  // ── Layout: words WITHOUT variants ─────────────────────────────────────────
  if (!hasVariants) {
    return (
      <div className="group flex items-baseline gap-3 py-2 border-b border-dusty-rose/10 last:border-0">
        <span className="font-display text-lg text-terracotta italic min-w-[80px]">
          {word.base_word}
        </span>
        {word.real_word && (
          <>
            <span className="text-stone-300 text-sm select-none">→</span>
            <span className="font-body text-stone-700 text-sm">{word.real_word}</span>
          </>
        )}
        <span className="font-handwritten text-stone-400 text-sm ml-auto whitespace-nowrap">
          {fmtDate(word.first_heard_at)}
        </span>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => onDeleteWord(word.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 text-xs leading-none flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    )
  }

  // ── Layout: words WITH variants (inline evolution) ──────────────────────────
  // Steps: base_word → variant1 → variant2 → ... → real_word
  return (
    <div className="group py-3 border-b border-dusty-rose/10 last:border-0">
      <div className="flex items-start gap-0">
        {/* Base word step */}
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="font-display text-base text-terracotta italic">{word.base_word}</span>
          <span className="font-handwritten text-stone-300 text-xs">{fmtShort(word.first_heard_at)}</span>
        </div>

        {/* Variant steps */}
        {sortedVariants.map((v) => (
          <div key={v.id} className="flex items-start group/variant">
            <span className="text-stone-300 text-sm mx-1.5 mt-0.5 select-none flex-shrink-0">→</span>
            <div className="flex flex-col items-center relative">
              {/* Variant text — editable */}
              {editingCell?.id === v.id && editingCell.field === 'variant' ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKey}
                  className="font-display text-base text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-20 text-center"
                />
              ) : (
                <span
                  className={`font-display text-base text-terracotta/80 italic ${isAuthenticated ? 'cursor-pointer hover:underline decoration-dotted' : ''}`}
                  onClick={() => isAuthenticated && startEdit(v.id, 'variant', v.variant)}
                >
                  {v.variant}
                </span>
              )}

              {/* Variant date — editable */}
              {editingCell?.id === v.id && editingCell.field === 'recorded_at' ? (
                <input
                  autoFocus
                  type="date"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKey}
                  className="font-handwritten text-xs text-stone-400 bg-transparent border-b border-stone-300 outline-none w-24 text-center"
                />
              ) : (
                <span
                  className={`font-handwritten text-stone-300 text-xs ${isAuthenticated ? 'cursor-pointer hover:text-stone-500' : ''}`}
                  onClick={() => isAuthenticated && startEdit(v.id, 'recorded_at', v.recorded_at)}
                >
                  {fmtShort(v.recorded_at)}
                </span>
              )}

              {/* Delete variant */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => handleDeleteVariant(v.id)}
                  className="absolute -top-1 -right-2 opacity-0 group-hover/variant:opacity-100 transition-opacity text-stone-300 hover:text-red-400 text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Real word (target) */}
        {word.real_word && (
          <>
            <span className="text-stone-300 text-sm mx-1.5 mt-0.5 select-none flex-shrink-0">→</span>
            <div className="flex flex-col items-center">
              <span className="font-body text-stone-600 text-sm">{word.real_word}</span>
              <span className="text-xs text-transparent select-none">·</span>
            </div>
          </>
        )}

        {/* Main date + delete on right */}
        <div className="ml-auto flex items-start gap-2 pl-3">
          <span className="font-handwritten text-stone-400 text-sm whitespace-nowrap">
            {fmtDate(word.first_heard_at)}
          </span>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => onDeleteWord(word.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 text-xs leading-none mt-0.5 flex-shrink-0"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
