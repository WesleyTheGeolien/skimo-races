import { useEffect, useMemo, useRef, useState } from 'react'
import { colorFor, type ColorBy } from '../colors'
import type { Race, Selection } from '../types'

interface Props {
  races: Race[]
  selection: Selection
  onSelect: (s: Selection) => void
  colorBy: ColorBy
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Month grid; multi-day races appear on every day they cover. */
export function CalendarView({ races, selection, onSelect, colorBy }: Props) {
  const dated = races.filter((r) => r.start_date)
  const firstMonth = useMemo(() => {
    const today = iso(new Date())
    const next = dated.find((r) => (r.end_date ?? r.start_date!) >= today) ?? dated[0]
    const d = next ? new Date(`${next.start_date}T12:00:00`) : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }, [dated.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const [month, setMonth] = useState(firstMonth)

  const byDay = useMemo(() => {
    const map = new Map<string, Race[]>()
    for (const r of dated) {
      const start = new Date(`${r.start_date}T12:00:00`)
      const end = new Date(`${r.end_date ?? r.start_date}T12:00:00`)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = iso(d)
        map.set(k, [...(map.get(k) ?? []), r])
      }
    }
    return map
  }, [dated])

  const cells = useMemo(() => {
    const first = new Date(month)
    const offset = (first.getDay() + 6) % 7 // Monday-first
    const start = new Date(first)
    start.setDate(1 - offset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  // A race picked elsewhere: switch to its month if it is off the grid, then scroll to it.
  const root = useRef<HTMLDivElement>(null)
  const pendingScroll = useRef(false)
  useEffect(() => {
    if (selection?.kind !== 'race') return
    pendingScroll.current = true
    const r = races.find((x) => x.id === selection.id)
    if (!r?.start_date) return
    const first = iso(cells[0])
    const last = iso(cells[cells.length - 1])
    const visible = r.start_date <= last && (r.end_date ?? r.start_date) >= first
    if (!visible) {
      const s = new Date(`${r.start_date}T12:00:00`)
      setMonth(new Date(s.getFullYear(), s.getMonth(), 1))
    }
  }, [selection]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pendingScroll.current) return
    // When the month is switching, the event only exists after the next render.
    const el = root.current?.querySelector('.cal-event.sel')
    if (!el) return
    pendingScroll.current = false
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selection, month])

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const today = iso(new Date())
  const tbc = races.filter((r) => !r.start_date)
  const inMonth = dated.filter((r) => {
    const s = new Date(`${r.start_date}T12:00:00`)
    return s.getMonth() === month.getMonth() && s.getFullYear() === month.getFullYear()
  }).length

  return (
    <div className="calendar" ref={root}>
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="Previous month">
          ‹
        </button>
        <h2>
          {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          <span className="muted"> · {inMonth} races</span>
        </h2>
        <button onClick={() => shift(1)} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-wd">
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const k = iso(d)
          const list = byDay.get(k) ?? []
          const outside = d.getMonth() !== month.getMonth()
          return (
            <div key={k} className={`cal-cell ${outside ? 'outside' : ''} ${k === today ? 'today' : ''}`}>
              <div className="cal-date">{d.getDate()}</div>
              {list.map((r) => (
                <button
                  key={r.id}
                  className={`cal-event ${selection?.kind === 'race' && selection.id === r.id ? 'sel' : ''}`}
                  style={{ borderLeftColor: colorFor(r, colorBy) }}
                  title={`${r.name} — ${r.location}`}
                  onClick={() => onSelect({ kind: 'race', id: r.id })}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )
        })}
      </div>
      {tbc.length > 0 && (
        <div className="tbc">
          <h3>No date yet</h3>
          {tbc.map((r) => (
            <button
              key={r.id}
              className={`cal-event ${selection?.kind === 'race' && selection.id === r.id ? 'sel' : ''}`}
              style={{ borderLeftColor: colorFor(r, colorBy) }}
              onClick={() => onSelect({ kind: 'race', id: r.id })}
            >
              {r.name} · {r.location}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
