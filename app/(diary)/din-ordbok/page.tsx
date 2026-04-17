'use client'

import React, { useState } from 'react'

const stages = [
  { word: 'Avo', date: '14 jan 2025' },
  { word: 'Avoka', date: '3 mar 2025' },
  { word: 'Avokada', date: '12 mai 2025' },
  { word: 'Avokado', date: '8 aug 2025' },
]

const desktopPaths: Record<number, string> = {
  0: 'M2,12 C10,2 20,22 30,12 C40,2 50,22 58,12',
  1: 'M2,16 C15,2 45,2 58,8',
  2: 'M2,8 C15,22 45,22 58,16',
}

const mobilePaths: Record<number, string> = {
  0: 'M12,2 C4,10 20,20 12,28',
  1: 'M12,2 C20,10 4,20 12,28',
  2: 'M12,2 C18,12 6,18 12,28',
}

function WavyArrow({ index }: { index: number }) {
  const id = `arrowhead-${index}`
  return (
    <>
      {/* Desktop arrow (horizontal, wider) */}
      <svg
        width="60"
        height="24"
        viewBox="0 0 60 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden md:block flex-shrink-0"
        aria-hidden="true"
      >
        <defs>
          <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#c4956a" />
          </marker>
        </defs>
        <path
          d={desktopPaths[index]}
          stroke="#c4956a"
          strokeWidth="1.5"
          fill="none"
          markerEnd={`url(#${id})`}
        />
      </svg>

      {/* Mobile arrow (vertical, shorter) */}
      <svg
        width="24"
        height="30"
        viewBox="0 0 24 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block md:hidden flex-shrink-0 ml-12"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={`${id}-mobile`}
            markerWidth="8"
            markerHeight="8"
            refX="3"
            refY="6"
            orient="auto"
          >
            <path d="M0,0 L6,0 L3,8 z" fill="#c4956a" />
          </marker>
        </defs>
        <path
          d={mobilePaths[index]}
          stroke="#c4956a"
          strokeWidth="1.5"
          fill="none"
          markerEnd={`url(#${id}-mobile)`}
        />
      </svg>
    </>
  )
}

type EditingCell = { stageIndex: number; field: 'word' | 'date' } | null

export default function DinOrdbokPage() {
  const [stageData, setStageData] = useState(stages)
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')

  function startEditing(stageIndex: number, field: 'word' | 'date') {
    setEditingCell({ stageIndex, field })
    setEditValue(stageData[stageIndex][field])
  }

  function commitEdit() {
    if (!editingCell) return
    const { stageIndex, field } = editingCell
    setStageData((prev) =>
      prev.map((s, i) => (i === stageIndex ? { ...s, [field]: editValue } : s)),
    )
    setEditingCell(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <div className="relative">
      <h2 className="font-display text-3xl text-stone-800 mb-2">Din ordbok</h2>
      <p className="font-handwritten text-sage text-xl mb-10">Ordene dine venter...</p>

      {/* Word evolution timeline — canonical word leads, then progression chips */}
      <div className="flex flex-col md:flex-row md:items-center gap-y-2 mb-10">
        {/* Canonical word — visually distinct from the progression chips */}
        <div className="flex flex-col items-start md:items-center flex-shrink-0">
          <span className="font-handwritten text-stone-400 text-xs mb-0.5">Ditt ord</span>
          <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl px-4 py-1.5">
            <span className="font-display text-xl text-terracotta italic">
              {stageData[stageData.length - 1].word}
            </span>
          </div>
        </div>

        {/* Separator */}
        <span className="hidden md:block text-stone-200 mx-3 text-lg self-center select-none">|</span>

        {stageData.map((stage, i) => (
          <React.Fragment key={i}>
            {/* Word bubble — compact chip: word · date on one line */}
            <div className="bg-white rounded-xl border border-dusty-rose/30 shadow-sm px-3 py-1.5 flex items-baseline gap-1.5">
              {editingCell?.stageIndex === i && editingCell.field === 'word' ? (
                <input
                  type="text"
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  className="font-display text-base text-terracotta bg-transparent border-b border-terracotta/40 outline-none w-20"
                />
              ) : (
                <span
                  className="font-display text-base text-terracotta cursor-pointer hover:underline decoration-dotted whitespace-nowrap"
                  onClick={() => startEditing(i, 'word')}
                >
                  {stage.word}
                </span>
              )}

              <span className="text-stone-300 text-xs select-none">·</span>

              {editingCell?.stageIndex === i && editingCell.field === 'date' ? (
                <input
                  type="text"
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  className="font-handwritten text-stone-400 text-sm bg-transparent border-b border-stone-300 outline-none w-20"
                />
              ) : (
                <span
                  className="font-handwritten text-stone-400 text-sm cursor-pointer hover:underline decoration-dotted whitespace-nowrap"
                  onClick={() => startEditing(i, 'date')}
                >
                  {stage.date}
                </span>
              )}
            </div>

            {/* Arrow connector */}
            {i < stageData.length - 1 && <WavyArrow index={i} />}
          </React.Fragment>
        ))}
      </div>

      {/* Coming soon message */}
      <div className="mt-10 max-w-sm opacity-50">
        <p className="font-body text-stone-400 italic leading-relaxed">
          Ordbok-siden vil snart fylles med dine første ord — hentet fra din personlige ordbok-app.
        </p>
      </div>

      {/* Decorative botanical accent */}
      <div className="absolute -right-4 top-0 opacity-10 pointer-events-none hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/svgs/botanical-1.svg" alt="" className="w-32" />
      </div>
    </div>
  )
}
