'use client'

import { useEffect, useRef, useState } from 'react'
import { GrowthRecord } from '@/lib/types'
import type { WhoRow } from '@/app/(diary)/din-utvikling/page'

interface UtviklingContentProps {
  initialRecords: GrowthRecord[]
  isAuthenticated: boolean
  birthDateISO: string
  whoWeight: WhoRow[]
  whoHeight: WhoRow[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

function dateToMs(iso: string) { return new Date(iso).getTime() }

// ── SVG Line Chart ──────────────────────────────────────────────────────────

interface LineChartProps {
  data: { date: string; value: number }[]
  unit: string
  color: string
  decimals?: number
  whoData?: WhoRow[]
  birthDateISO?: string
}

function LineChart({ data, unit, color, decimals = 1, whoData, birthDateISO }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(300)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  if (data.length === 0) return (
    <p className="font-body text-stone-400 text-sm italic text-center py-8">Ingen data ennå.</p>
  )

  const pad = { top: 16, right: 16, bottom: 40, left: 44 }
  const svgH = 200
  const chartW = width - pad.left - pad.right
  const chartH = svgH - pad.top - pad.bottom

  // Time-based X axis
  const birthMs = birthDateISO ? dateToMs(birthDateISO) : null
  const minDateMs = dateToMs(data[0].date)
  const maxDateMs = dateToMs(data[data.length - 1].date)
  const dateRange = maxDateMs - minDateMs || 1

  function dateToX(iso: string) {
    return pad.left + ((dateToMs(iso) - minDateMs) / dateRange) * chartW
  }

  // Collect all values (data + visible WHO) for Y scale
  const allValues = data.map((d) => d.value)
  let visibleWho: WhoRow[] = []
  if (whoData && birthMs) {
    visibleWho = whoData.filter((row) => {
      const rowMs = birthMs + row.age_months * 30.44 * 24 * 3600 * 1000
      return rowMs >= minDateMs - 30 * 24 * 3600 * 1000 && rowMs <= maxDateMs + 30 * 24 * 3600 * 1000
    })
    visibleWho.forEach((row) => { allValues.push(row.p3, row.p97) })
  }

  const minV = Math.min(...allValues)
  const maxV = Math.max(...allValues)
  const rangeV = maxV - minV || 1
  const paddedMin = minV - rangeV * 0.05
  const paddedMax = maxV + rangeV * 0.05
  const paddedRange = paddedMax - paddedMin

  function valToY(v: number) {
    return pad.top + chartH - ((v - paddedMin) / paddedRange) * chartH
  }

  function ageMonthsToX(months: number) {
    if (!birthMs) return null
    const ms = birthMs + months * 30.44 * 24 * 3600 * 1000
    return pad.left + ((ms - minDateMs) / dateRange) * chartW
  }

  // WHO band paths
  let whoP3P97Path = ''
  let whoP50Path = ''
  if (visibleWho.length >= 2) {
    const p97pts = visibleWho.map((r) => {
      const x = ageMonthsToX(r.age_months)!
      return `${x.toFixed(1)},${valToY(r.p97).toFixed(1)}`
    })
    const p3pts = [...visibleWho].reverse().map((r) => {
      const x = ageMonthsToX(r.age_months)!
      return `${x.toFixed(1)},${valToY(r.p3).toFixed(1)}`
    })
    whoP3P97Path = `M${p97pts.join(' L')} L${p3pts.join(' L')} Z`
    whoP50Path = visibleWho.map((r, i) => {
      const x = ageMonthsToX(r.age_months)!
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${valToY(r.p50).toFixed(1)}`
    }).join(' ')
  }

  // Data points
  const points = data.map((d) => ({
    x: dateToX(d.date),
    y: valToY(d.value),
    value: d.value,
    label: d.date,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Y axis ticks
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount }, (_, i) => ({
    v: paddedMin + (paddedRange * i) / (tickCount - 1),
    y: pad.top + chartH - (i / (tickCount - 1)) * chartH,
  }))

  // X axis ticks — time-spaced, avoid crowding
  const maxLabels = Math.max(2, Math.floor(chartW / 60))
  const step = Math.max(1, Math.ceil(data.length / maxLabels))
  const xTicks = points.filter((_, i) => i % step === 0 || i === points.length - 1)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let closest = points[0]; let minDist = Infinity
    for (const p of points) { const d = Math.abs(p.x - mx); if (d < minDist) { minDist = d; closest = p } }
    setTooltip(closest)
  }

  function handleTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.touches[0].clientX - rect.left
    let closest = points[0]; let minDist = Infinity
    for (const p of points) { const d = Math.abs(p.x - mx); if (d < minDist) { minDist = d; closest = p } }
    setTooltip(closest)
  }

  return (
    <div ref={containerRef} className="w-full relative select-none">
      <svg
        width={width} height={svgH}
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}
        onTouchMove={handleTouchMove} onTouchEnd={() => setTooltip(null)}
        className="overflow-visible"
      >
        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} y1={t.y} x2={pad.left + chartW} y2={t.y} stroke="#e7e0d0" strokeWidth={1} />
            <text x={pad.left - 6} y={t.y + 4} textAnchor="end" fontSize={10} fill="#a8a29e" fontFamily="inherit">
              {t.v.toFixed(decimals)}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {xTicks.map((p, i) => (
          <text key={i} x={p.x} y={pad.top + chartH + 20} textAnchor="middle" fontSize={10} fill="#a8a29e" fontFamily="inherit">
            {fmtDateShort(p.label)}
          </text>
        ))}

        {/* WHO band p3–p97 */}
        {whoP3P97Path && (
          <path d={whoP3P97Path} fill="#94a3b8" fillOpacity={0.1} />
        )}

        {/* WHO p50 median */}
        {whoP50Path && (
          <path d={whoP50Path} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,3" opacity={0.7} />
        )}

        {/* Data line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Data dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" stroke={color} strokeWidth={2} />
        ))}

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={pad.top} x2={tooltip.x} y2={pad.top + chartH}
              stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill={color} />
          </>
        )}
      </svg>

      {/* Tooltip bubble */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-dusty-rose/30 rounded-lg px-2.5 py-1.5 shadow-md text-xs font-body text-stone-700 whitespace-nowrap"
          style={{ left: Math.min(Math.max(tooltip.x, 60), width - 60), top: 4, transform: 'translateX(-50%)' }}
        >
          <span className="font-medium">{tooltip.value.toFixed(decimals)} {unit}</span>
          <span className="text-stone-400 ml-1.5">{fmtDate(tooltip.label)}</span>
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function UtviklingContent({
  initialRecords, isAuthenticated, birthDateISO, whoWeight, whoHeight,
}: UtviklingContentProps) {
  const [records, setRecords] = useState<GrowthRecord[]>(initialRecords)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    recorded_at: new Date().toISOString().split('T')[0],
    weight_kg: '',
    height_cm: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const weightData = records.filter((r) => r.weight_kg != null).map((r) => ({ date: r.recorded_at, value: r.weight_kg! }))
  const heightData = records.filter((r) => r.height_cm != null).map((r) => ({ date: r.recorded_at, value: r.height_cm! }))
  const latestWeight = weightData.at(-1)
  const latestHeight = heightData.at(-1)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.weight_kg && !form.height_cm) { setError('Fyll inn minst én verdi'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recorded_at: form.recorded_at,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        }),
      })
      if (!res.ok) throw new Error()
      const created: GrowthRecord = await res.json()
      setRecords((prev) => [...prev, created].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)))
      setForm({ recorded_at: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '' })
      setAdding(false)
    } catch {
      setError('Kunne ikke lagre måling')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-terracotta">Din utvikling</h2>
          <p className="font-body text-sm text-stone-500 mt-1">Vekst og høyde over tid</p>
        </div>
        {isAuthenticated && !adding && (
          <button onClick={() => setAdding(true)} className="font-body text-sm text-terracotta hover:text-terracotta/70 transition-colors">
            + Ny måling
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-8 bg-white/60 rounded-xl border border-dusty-rose/30 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Dato</label>
              <input type="date" value={form.recorded_at}
                onChange={(e) => setForm((f) => ({ ...f, recorded_at: e.target.value }))}
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60" />
            </div>
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Vekt (kg)</label>
              <input type="number" step="0.01" min="0" placeholder="f.eks. 8.5" value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60" />
            </div>
            <div>
              <label className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1 block">Høyde (cm)</label>
              <input type="number" step="0.1" min="0" placeholder="f.eks. 72" value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 font-body text-sm text-stone-700 bg-transparent outline-none focus:border-terracotta/60" />
            </div>
          </div>
          {error && <p className="font-body text-xs text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="font-body text-sm px-5 py-2 bg-terracotta text-cream rounded-lg hover:bg-terracotta/80 transition-colors disabled:opacity-50">
              {saving ? 'Lagrer…' : 'Lagre'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setError('') }}
              className="font-body text-sm px-5 py-2 text-stone-500 hover:text-stone-700 transition-colors">
              Avbryt
            </button>
          </div>
        </form>
      )}

      {(latestWeight || latestHeight) && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {latestWeight && (
            <div className="bg-white/60 rounded-xl border border-dusty-rose/30 p-4">
              <p className="font-body text-xs text-stone-400 uppercase tracking-wide">Siste vekt</p>
              <p className="font-display text-2xl text-terracotta mt-1">{latestWeight.value.toFixed(2)} <span className="text-base text-stone-400">kg</span></p>
              <p className="font-body text-xs text-stone-400 mt-1">{fmtDate(latestWeight.date)}</p>
            </div>
          )}
          {latestHeight && (
            <div className="bg-white/60 rounded-xl border border-dusty-rose/30 p-4">
              <p className="font-body text-xs text-stone-400 uppercase tracking-wide">Siste høyde</p>
              <p className="font-display text-2xl text-terracotta mt-1">{latestHeight.value.toFixed(1)} <span className="text-base text-stone-400">cm</span></p>
              <p className="font-body text-xs text-stone-400 mt-1">{fmtDate(latestHeight.date)}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {weightData.length > 0 && (
          <div className="bg-white/60 rounded-xl border border-dusty-rose/30 p-5">
            <h3 className="font-body text-sm font-medium text-stone-600 mb-4">Vekt (kg)</h3>
            <LineChart data={weightData} unit="kg" color="#C4674A" decimals={2}
              whoData={whoWeight} birthDateISO={birthDateISO} />
          </div>
        )}
        {heightData.length > 0 && (
          <div className="bg-white/60 rounded-xl border border-dusty-rose/30 p-5">
            <h3 className="font-body text-sm font-medium text-stone-600 mb-4">Høyde (cm)</h3>
            <LineChart data={heightData} unit="cm" color="#8FAF8A" decimals={1}
              whoData={whoHeight} birthDateISO={birthDateISO} />
          </div>
        )}
        {records.length === 0 && !adding && (
          <p className="font-body text-stone-400 text-sm italic text-center mt-16">Ingen målinger ennå.</p>
        )}
      </div>
    </div>
  )
}
