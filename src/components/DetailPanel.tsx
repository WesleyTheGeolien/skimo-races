import { useEffect, useState } from 'react'
import { formatDateRange, nextRace, placeKey } from '../filters'
import { shareRace, type ShareResult } from '../share'
import { colorFor, type ColorBy } from '../colors'
import { LEVEL_COLORS, OFFICIAL_CALENDAR_URL, type Race, type Selection } from '../types'

interface Props {
  races: Race[] // all races, so a selection survives filter changes
  selection: Selection
  onSelect: (s: Selection) => void
  colorBy: ColorBy
}

const SHARE_LABEL: Partial<Record<ShareResult, string>> = { copied: 'Link copied ✓', failed: 'Copy failed' }

function ShareButton({ race }: { race: Race }) {
  const [result, setResult] = useState<ShareResult | null>(null)
  // Reset the feedback after a moment, or straight away for another race.
  useEffect(() => setResult(null), [race.id])
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => setResult(null), 2000)
    return () => clearTimeout(t)
  }, [result])

  const note = result && SHARE_LABEL[result]
  return (
    <button
      className={`share ${result === 'copied' ? 'done' : ''}`}
      onClick={async () => setResult(await shareRace(race))}
      aria-label={`Share ${race.name}`}
      title="Share"
    >
      {result === 'copied' ? <CheckIcon /> : <ShareIcon />}
      <span className="share-note" role="status">
        {note}
      </span>
    </button>
  )
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

// Box with an arrow out of it: the share symbol phones use.
const ShareIcon = () => (
  <svg {...iconProps}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" />
  </svg>
)

const CheckIcon = () => (
  <svg {...iconProps}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export function DetailPanel({ races, selection, onSelect, colorBy }: Props) {
  // Nothing selected: the compact race list below takes the whole column.
  if (!selection) return null

  // A map marker: show the venue's next race in full, with its other races below.
  const r =
    selection.kind === 'race'
      ? races.find((x) => x.id === selection.id)
      : nextRace(races.filter((x) => placeKey(x) === selection.key))
  if (!r) return null
  const key = placeKey(r)
  const others = key ? races.filter((x) => placeKey(x) === key && x.id !== r.id) : []

  return (
    <div className="detail">
      <button className="close" onClick={() => onSelect(null)} aria-label="Close">
        ×
      </button>
      <ShareButton race={r} />
      <h2>{r.name}</h2>
      <p className="date">{formatDateRange(r)}</p>
      <p className="muted">
        {r.location}
        {r.region ? `, ${r.region}` : ''}
        {r.country !== 'France' ? `, ${r.country}` : ''}
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
      <div className="actions">
        {r.url && (
          <a href={r.url} target="_blank" rel="noreferrer" className="button">
            Race website ↗
          </a>
        )}
        <a href={OFFICIAL_CALENDAR_URL} target="_blank" rel="noopener noreferrer" className="button secondary">
          Official calendar ↗
        </a>
      </div>
      {others.length > 0 && (
        <>
          <h3 className="other-races">Also at {r.location}</h3>
          <ul className="place-list">
            {others.map((o) => (
              <li key={o.id}>
                <button className="link" onClick={() => onSelect({ kind: 'race', id: o.id })}>
                  <span className="dot" style={{ background: colorFor(o, colorBy) }} />
                  {formatDateRange(o)} — {o.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
