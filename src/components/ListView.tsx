import { useEffect, useRef } from 'react'
import { formatDateRange } from '../filters'
import { colorFor, type ColorBy } from '../colors'
import type { Race, Selection } from '../types'
import { EmptyState } from './Logo'

interface Props {
  races: Race[]
  selection: Selection
  onSelect: (s: Selection) => void
  colorBy: ColorBy
}

export function ListView({ races, selection, onSelect, colorBy }: Props) {
  const ref = useRef<HTMLTableElement>(null)

  // Scroll to a race picked in the sidebar, map or calendar.
  useEffect(() => {
    ref.current?.querySelector('tr.sel')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selection])

  if (!races.length) return <EmptyState>No races match these filters.</EmptyState>
  return (
    <table className="list" ref={ref}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Race</th>
          <th>Where</th>
          <th>Level</th>
        </tr>
      </thead>
      <tbody>
        {races.map((r) => {
          const sel = selection?.kind === 'race' && selection.id === r.id
          return (
            <tr key={r.id} className={sel ? 'sel' : ''} onClick={() => onSelect({ kind: 'race', id: r.id })}>
              <td className="nowrap">{formatDateRange(r)}</td>
              <td>
                <span className="dot" style={{ background: colorFor(r, colorBy) }} />
                {r.name}
                {r.is_night && <span className="tag">night</span>}
              </td>
              <td>{r.location}</td>
              <td className="nowrap">{r.level}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
