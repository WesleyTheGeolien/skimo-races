import { useMemo } from 'react'
import { COLOR_BY_OPTIONS, colorKeyItems, FILTER_FIELD, toggleKey, type ColorBy } from '../colors'
import type { Filters } from '../filters'
import type { Race } from '../types'

interface Props {
  races: Race[] // all races; counts are worked out against the other filters
  filters: Filters
  onChange: (f: Filters) => void
  colorBy: ColorBy
  onColorBy: (c: ColorBy) => void
}

/** Colour key for the chosen dimension; each entry is also a filter on that dimension. */
export function ColorKey({ races, filters, onChange, colorBy, onColorBy }: Props) {
  const items = useMemo(() => colorKeyItems(races, filters, colorBy), [races, filters, colorBy])
  const field = FILTER_FIELD[colorBy]
  const active = filters[field].length > 0

  return (
    <div className="color-key">
      <div className="color-key-head">
        <span className="color-key-title">Colour by</span>
        <div className="segmented" role="radiogroup" aria-label="Colour by">
          {COLOR_BY_OPTIONS.map((o) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={colorBy === o.value}
              className={colorBy === o.value ? 'on' : ''}
              onClick={() => onColorBy(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chips">
        {items.map((i) => (
          <button
            key={i.key}
            className={`chip ${i.on ? 'on' : ''} ${active && !i.on ? 'dim' : ''}`}
            aria-pressed={i.on}
            title={i.on ? `Stop filtering on ${i.label}` : `Show only ${i.label}`}
            onClick={() => onChange(toggleKey(filters, colorBy, i.key))}
          >
            <span className="dot" style={{ background: i.color }} />
            {i.label}
            <span className="chip-count">{i.count}</span>
          </button>
        ))}
        {active && (
          <button className="link small-link" onClick={() => onChange({ ...filters, [field]: [] })}>
            Show all
          </button>
        )}
      </div>
    </div>
  )
}
