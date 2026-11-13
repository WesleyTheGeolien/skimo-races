import { formatDateRange, placeKey, raceDistance } from '../filters'
import { LEVEL_COLORS, type Home, type Race, type Selection } from '../types'

interface Props {
  races: Race[] // all races, so a selection survives filter changes
  selection: Selection
  onSelect: (s: Selection) => void
  home: Home
}

export function DetailPanel({ races, selection, onSelect, home }: Props) {
  if (!selection) {
    return (
      <aside className="detail empty-detail">
        <p>Pick a race on the map, calendar or list to see its details.</p>
      </aside>
    )
  }

  if (selection.kind === 'place') {
    const list = races.filter((r) => placeKey(r) === selection.key)
    if (!list.length) return null
    const d = raceDistance(list[0], home)
    return (
      <aside className="detail">
        <button className="close" onClick={() => onSelect(null)} aria-label="Close">
          ×
        </button>
        <h2>{list[0].location}</h2>
        <p className="muted">
          {[list[0].region, list[0].country].filter(Boolean).join(', ')}
          {d != null && ` · ${Math.round(d)} km from ${home.name}`}
        </p>
        <ul className="place-list">
          {list.map((r) => (
            <li key={r.id}>
              <button className="link" onClick={() => onSelect({ kind: 'race', id: r.id })}>
                <span className="dot" style={{ background: LEVEL_COLORS[r.level] }} />
                {formatDateRange(r)} — {r.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    )
  }

  const r = races.find((x) => x.id === selection.id)
  if (!r) return null
  const d = raceDistance(r, home)
  const key = placeKey(r)
  const sameVenue = key ? races.filter((x) => placeKey(x) === key).length : 1

  return (
    <aside className="detail">
      <button className="close" onClick={() => onSelect(null)} aria-label="Close">
        ×
      </button>
      <h2>{r.name}</h2>
      <p className="date">{formatDateRange(r)}</p>
      <p className="muted">
        {r.location}
        {r.region ? `, ${r.region}` : ''}
        {r.country !== 'France' ? `, ${r.country}` : ''}
        {d != null && ` · ${Math.round(d)} km from ${home.name}`}
      </p>
      <div className="badges">
        <span className="badge" style={{ background: LEVEL_COLORS[r.level] }}>
          {r.level}
        </span>
        {r.disciplines.map((x) => (
          <span key={x} className="badge outline">
            {x}
          </span>
        ))}
        {r.is_night && <span className="badge outline">Night</span>}
        {r.status !== 'Confirmed' && <span className="badge warn">{r.status}</span>}
      </div>
      {r.details && <p>{r.details}</p>}
      {r.url && (
        <div className="actions">
          <a href={r.url} target="_blank" rel="noreferrer" className="button">
            Race website ↗
          </a>
        </div>
      )}
      {key && sameVenue > 1 && (
        <button className="link small" onClick={() => onSelect({ kind: 'place', key })}>
          See all {sameVenue} races at {r.location}
        </button>
      )}
    </aside>
  )
}
