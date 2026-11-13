import { formatDateRange, raceDistance } from '../filters'
import { LEVEL_COLORS, type Home, type Race, type Selection } from '../types'

interface Props {
  races: Race[]
  home: Home
  selection: Selection
  onSelect: (s: Selection) => void
}

export function ListView({ races, home, selection, onSelect }: Props) {
  if (!races.length) return <p className="empty">No races match these filters.</p>
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Date</th>
          <th>Race</th>
          <th>Where</th>
          <th>Level</th>
          <th className="num">km</th>
        </tr>
      </thead>
      <tbody>
        {races.map((r) => {
          const d = raceDistance(r, home)
          const sel = selection?.kind === 'race' && selection.id === r.id
          return (
            <tr key={r.id} className={sel ? 'sel' : ''} onClick={() => onSelect({ kind: 'race', id: r.id })}>
              <td className="nowrap">{formatDateRange(r)}</td>
              <td>
                {r.name}
                {r.is_night && <span className="tag">night</span>}
              </td>
              <td>{r.location}</td>
              <td className="nowrap">
                <span className="dot" style={{ background: LEVEL_COLORS[r.level] }} />
                {r.level}
              </td>
              <td className="num">{d == null ? '–' : Math.round(d)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
