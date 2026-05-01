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

  function updateWord(updated: WordEntry) {
    setWords((prev) => prev.map((w) => (w.id === updated.id ? { ...updated, variants: w.variants } : w)))
  }

  function deleteWordVariant(wordId: string, variantId: string) {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, variants: w.variants!.filter((v) => v.id !== variantId) } : w
      )
    )
  }

  function addWordVariant(wordId: string, newVariant: WordVariant) {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, variants: [...(w.variants ?? []), newVariant] } : w
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-stone-800">Din ordbok</h2>
          <p className="font-handwritten text-sage text-xl">Ord og uttrykk over årene</p>
          <p className="font-body text-sm text-stone-500 mt-1">{words.length} ord lært</p>
        </div>
        {isAuthenticated && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="font-body text-sm text-terracotta hover:text-terracotta/70 transition-colors"
          >
            + Legg til ord
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-8 bg-white/60 rounded-xl border border-dusty-rose/30 p-5 space-y-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Sofias ord</label>
              <input
                type="text"
                value={form.base_word}
                onChange={(e) => setForm((f) => ({ ...f, base_word: e.target.value }))}
                placeholder="f.eks. Avo"
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Egentlig ord</label>
              <input
                type="text"
                value={form.real_word}
                onChange={(e) => setForm((f) => ({ ...f, real_word: e.target.value }))}
                placeholder="f.eks. Avokado"
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
              />
            </div>
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Dato</label>
              <input
                type="date"
                value={form.first_heard_at}
                onChange={(e) => setForm((f) => ({ ...f, first_heard_at: e.target.value }))}
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60"
              />
            </div>
          </div>
          {error && <p className="font-body text-xs text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="font-body text-sm px-5 py-2 bg-terracotta text-cream rounded-lg hover:bg-terracotta/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Lagrer…' : 'Lagre'}
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

      <div className="space-y-0">
        {words.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            isAuthenticated={isAuthenticated}
            onDeleteWord={handleDeleteWord}
            onWordUpdate={updateWord}
            onVariantUpdate={updateWordVariants}
            onVariantDelete={deleteWordVariant}
            onVariantAdd={addWordVariant}
          />
        ))}
        {words.length === 0 && !adding && (
          <p className="font-body text-stone-400 italic text-sm">Ingen ord enda...</p>
        )}
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
  onWordUpdate,
  onVariantUpdate,
  onVariantDelete,
  onVariantAdd,
}: {
  word: WordEntry
  isAuthenticated: boolean
  onDeleteWord: (id: string) => void
  onWordUpdate: (updated: WordEntry) => void
  onVariantUpdate: (wordId: string, v: WordVariant) => void
  onVariantDelete: (wordId: string, variantId: string) => void
  onVariantAdd: (wordId: string, v: WordVariant) => void
}) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const [editingBase, setEditingBase] = useState<'base_word' | 'first_heard_at' | null>(null)
  const [baseEditValue, setBaseEditValue] = useState('')
  const [addingVariant, setAddingVariant] = useState(false)
  const [variantForm, setVariantForm] = useState({ variant: '', recorded_at: new Date().toISOString().split('T')[0] })
  const [variantSaving, setVariantSaving] = useState(false)

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault()
    if (!variantForm.variant.trim()) return
    setVariantSaving(true)
    const res = await fetch(`/api/words/${word.id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variantForm),
    })
    if (res.ok) {
      onVariantAdd(word.id, await res.json())
      setVariantForm({ variant: '', recorded_at: new Date().toISOString().split('T')[0] })
      setAddingVariant(false)
    }
    setVariantSaving(false)
  }

  function startEditBase(field: 'base_word' | 'first_heard_at', current: string) {
    setEditingBase(field)
    setBaseEditValue(current)
  }

  async function commitBaseEdit() {
    if (!editingBase) return
    setEditingBase(null)
    const res = await fetch(`/api/words/${word.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [editingBase]: baseEditValue.trim() }),
    })
    if (res.ok) onWordUpdate(await res.json())
  }

  function handleBaseKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') setEditingBase(null)
  }

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
      <>
      <div className="group flex items-baseline gap-3 py-2 border-b border-dusty-rose/10 last:border-0">
        {editingBase === 'base_word' ? (
          <input
            autoFocus
            type="text"
            value={baseEditValue}
            onChange={(e) => setBaseEditValue(e.target.value)}
            onBlur={commitBaseEdit}
            onKeyDown={handleBaseKey}
            className="font-display text-lg text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-24"
          />
        ) : (
          <span
            className={`font-display text-lg text-terracotta italic min-w-[80px] ${isAuthenticated ? 'cursor-pointer hover:underline decoration-dotted' : ''}`}
            onClick={() => isAuthenticated && startEditBase('base_word', word.base_word)}
          >
            {word.base_word}
          </span>
        )}
        {word.real_word && (
          <>
            <span className="text-stone-300 text-lg select-none">→</span>
            <span className="font-body text-stone-500 text-lg italic">{word.real_word}</span>
          </>
        )}
        {editingBase === 'first_heard_at' ? (
          <input
            autoFocus
            type="date"
            value={baseEditValue}
            onChange={(e) => setBaseEditValue(e.target.value)}
            onBlur={commitBaseEdit}
            onKeyDown={handleBaseKey}
            className="font-handwritten text-stone-400 text-sm ml-auto bg-transparent border-b border-stone-300 outline-none"
          />
        ) : (
          <span
            className={`font-handwritten text-stone-400 text-sm ml-auto whitespace-nowrap ${isAuthenticated ? 'cursor-pointer hover:text-stone-600' : ''}`}
            onClick={() => isAuthenticated && startEditBase('first_heard_at', word.first_heard_at)}
          >
            {fmtDate(word.first_heard_at)}
          </span>
        )}
        {isAuthenticated && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setAddingVariant(true)}
              className="text-stone-300 hover:text-terracotta text-xs leading-none"
              title="Legg til variant"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => onDeleteWord(word.id)}
              className="text-stone-300 hover:text-red-400 text-xs leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {addingVariant && (
        <form onSubmit={handleAddVariant} className="flex items-center gap-2 mt-1 ml-1">
          <input
            autoFocus
            type="text"
            value={variantForm.variant}
            onChange={(e) => setVariantForm((f) => ({ ...f, variant: e.target.value }))}
            placeholder="Ny variant"
            className="font-display text-sm text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-24"
            onKeyDown={(e) => e.key === 'Escape' && setAddingVariant(false)}
          />
          <input
            type="date"
            value={variantForm.recorded_at}
            onChange={(e) => setVariantForm((f) => ({ ...f, recorded_at: e.target.value }))}
            className="font-handwritten text-xs text-stone-400 bg-transparent border-b border-stone-300 outline-none"
          />
          <button type="submit" disabled={variantSaving} className="font-body text-xs text-terracotta hover:text-terracotta/70 disabled:opacity-50">
            {variantSaving ? '…' : 'Lagre'}
          </button>
          <button type="button" onClick={() => setAddingVariant(false)} className="font-body text-xs text-stone-400 hover:text-stone-600">
            Avbryt
          </button>
        </form>
      )}
      </>
    )
  }

  // ── Layout: words WITH variants (inline evolution) ──────────────────────────
  // Steps: base_word → variant1 → variant2 → ... → real_word
  return (
    <div className="group py-3 border-b border-dusty-rose/10 last:border-0">
      <div className="flex items-start gap-0">
        {/* Base word step */}
        <div className="flex flex-col items-center flex-shrink-0">
          {editingBase === 'base_word' ? (
            <input
              autoFocus
              type="text"
              value={baseEditValue}
              onChange={(e) => setBaseEditValue(e.target.value)}
              onBlur={commitBaseEdit}
              onKeyDown={handleBaseKey}
              className="font-display text-lg text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-20 text-center"
            />
          ) : (
            <span
              className={`font-display text-lg text-terracotta italic ${isAuthenticated ? 'cursor-pointer hover:underline decoration-dotted' : ''}`}
              onClick={() => isAuthenticated && startEditBase('base_word', word.base_word)}
            >
              {word.base_word}
            </span>
          )}
          {editingBase === 'first_heard_at' ? (
            <input
              autoFocus
              type="date"
              value={baseEditValue}
              onChange={(e) => setBaseEditValue(e.target.value)}
              onBlur={commitBaseEdit}
              onKeyDown={handleBaseKey}
              className="font-handwritten text-xs text-stone-400 bg-transparent border-b border-stone-300 outline-none w-24 text-center"
            />
          ) : (
            <span
              className={`font-handwritten text-stone-300 text-xs ${isAuthenticated ? 'cursor-pointer hover:text-stone-500' : ''}`}
              onClick={() => isAuthenticated && startEditBase('first_heard_at', word.first_heard_at)}
            >
              {fmtShort(word.first_heard_at)}
            </span>
          )}
        </div>


        {/* Variant steps */}
        {sortedVariants.map((v) => (
          <div key={v.id} className="flex items-start group/variant">
            <span className="text-stone-300 text-lg mx-1.5 select-none flex-shrink-0">→</span>
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
                  className="font-display text-lg text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-20 text-center"
                />
              ) : (
                <span
                  className={`font-display text-lg text-terracotta/80 italic ${isAuthenticated ? 'cursor-pointer hover:underline decoration-dotted' : ''}`}
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
            <span className="text-stone-300 text-lg mx-1.5 select-none flex-shrink-0">→</span>
            <span className="font-body text-stone-500 text-lg italic">{word.real_word}</span>
          </>
        )}

        {/* Main date + actions on right */}
        <div className="ml-auto flex items-start gap-2 pl-3">
          <span className="font-handwritten text-stone-400 text-sm whitespace-nowrap">
            {fmtDate(word.first_heard_at)}
          </span>
          {isAuthenticated && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setAddingVariant(true)}
                className="text-stone-300 hover:text-terracotta text-xs leading-none mt-0.5"
                title="Legg til variant"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onDeleteWord(word.id)}
                className="text-stone-300 hover:text-red-400 text-xs leading-none mt-0.5 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      {addingVariant && (
        <form onSubmit={handleAddVariant} className="flex items-center gap-2 mt-1 ml-1">
          <input
            autoFocus
            type="text"
            value={variantForm.variant}
            onChange={(e) => setVariantForm((f) => ({ ...f, variant: e.target.value }))}
            placeholder="Ny variant"
            className="font-display text-sm text-terracotta italic bg-transparent border-b border-terracotta/40 outline-none w-24"
            onKeyDown={(e) => e.key === 'Escape' && setAddingVariant(false)}
          />
          <input
            type="date"
            value={variantForm.recorded_at}
            onChange={(e) => setVariantForm((f) => ({ ...f, recorded_at: e.target.value }))}
            className="font-handwritten text-xs text-stone-400 bg-transparent border-b border-stone-300 outline-none"
          />
          <button type="submit" disabled={variantSaving} className="font-body text-xs text-terracotta hover:text-terracotta/70 disabled:opacity-50">
            {variantSaving ? '…' : 'Lagre'}
          </button>
          <button type="button" onClick={() => setAddingVariant(false)} className="font-body text-xs text-stone-400 hover:text-stone-600">
            Avbryt
          </button>
        </form>
      )}
    </div>
  )
}
