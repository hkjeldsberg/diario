'use client'

import { useState } from 'react'
import { Entry } from '@/lib/types'
import DiaryEntry from './DiaryEntry'
import AddEntryForm from './AddEntryForm'

interface DiaryTabContentProps {
  initialEntries: Entry[]
  isAuthenticated: boolean
  minDate: string
  maxDate: string
  tabKey: string
  heading: string
  subtitle: string
}

export default function DiaryTabContent({
  initialEntries,
  isAuthenticated,
  minDate,
  maxDate,
  tabKey,
  heading,
  subtitle,
}: DiaryTabContentProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)

  function handleNewEntry(newEntry: Entry) {
    setEntries((prev) =>
      [...prev, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    )
  }

  function handleUpdateEntry(updated: Entry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function handleDeleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-stone-800 mb-2">{heading}</h2>
      <p className="font-handwritten text-sage text-xl mb-8">{subtitle}</p>

      {/* Entry list */}
      {entries.length === 0 ? (
        <p className="font-body text-stone-400 italic">Ingen minner enda...</p>
      ) : (
        <div>
          {entries.map((entry, index) => (
            <DiaryEntry
              key={entry.id}
              entry={entry}
              isAuthenticated={isAuthenticated}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Add entry form — only shown when authenticated */}
      {isAuthenticated && (
        <AddEntryForm
          tabKey={tabKey}
          minDate={minDate}
          maxDate={maxDate}
          onSuccess={handleNewEntry}
        />
      )}
    </div>
  )
}
