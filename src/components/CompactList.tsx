import { useEffect, useMemo, useRef } from 'react'
import { groupByMonth, shortDay } from '../compact'
import { isPast, placeKey, todayIso } from '../filters'
import { colorFor, type ColorBy } from '../colors'
import type { Race, Selection } from '../types'
import { EmptyState } from './Logo'

interface Props {
  races: Race[]
  selection: Selection
  onSelect: (s: Selection) => void
  colorBy: ColorBy
}

function TodayMarker() {
  const label = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return <div className="compact-today">Today · {label}</div>
}

/** Compact, month-grouped race list for the sidebar; opens at today, with past races greyed. */
export function CompactList({ races, selection, onSelect, colorBy }: Props) {
  const groups = useMemo(() => groupByMonth(races), [races])
  const today = todayIso()
  // The "Today" line goes before the first race that is not over yet, or after the last dated race.
  const firstUpcoming = races.find((r) => r.start_date && !isPast(r, today))?.id
  const lastDatedGroup = groups.filter((g) => g.key !== 'tbc').at(-1)?.key
  const ref = useRef<HTMLDivElement>(null)

  // Open at today's date.
  useEffect(() => {
    ref.current?.querySelector('.compact-today')?.scrollIntoView({ block: 'start' })
  }, [])

  // Keep the selected race visible when it is picked elsewhere (map, calendar, list).
  useEffect(() => {
    ref.current?.querySelector('.compact-row.sel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selection])

  if (!races.length) return <EmptyState small>No races match these filters.</EmptyState>

  const isSel = (r: Race) =>
    selection?.kind === 'race' ? selection.id === r.id : selection?.kind === 'place' && placeKey(r) === selection.key

  return (
    <div className="compact" ref={ref}>
      {groups.map((g) => (
        <section key={g.key}>
          <h4 className="compact-month">{g.label}</h4>
          {g.races.map((r) => (
            <div key={r.id} className="compact-item">
              {r.id === firstUpcoming && <TodayMarker />}
              <button
                className={`compact-row ${isSel(r) ? 'sel' : ''} ${isPast(r, today) ? 'past' : ''}`}
                title={`${r.name} — ${r.location}`}
                onClick={() => onSelect({ kind: 'race', id: r.id })}
              >
                <span className="compact-day">{shortDay(r)}</span>
                <span className="dot" style={{ background: colorFor(r, colorBy) }} />
                <span className="compact-name">
                  {r.name}
                  <span className="muted"> · {r.location}</span>
                </span>
              </button>
            </div>
          ))}
          {!firstUpcoming && g.key === lastDatedGroup && <TodayMarker />}
        </section>
      ))}
    </div>
  )
}
