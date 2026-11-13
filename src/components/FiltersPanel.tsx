import { DEFAULT_FILTERS, type Filters } from '../filters'
import { allItems, FORMAT_COLORS, type ColorBy } from '../colors'
import { DISCIPLINES, LEVEL_COLORS, LEVELS, type Race } from '../types'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  shown: number
  total: number
  races: Race[]
  colorBy: ColorBy
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function FiltersPanel({ filters, onChange, shown, total, races, colorBy }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  return (
    <aside className="filters">
      <div className="filters-head">
        <strong>
          {shown} of {total} races
        </strong>
        <button className="link" onClick={() => onChange(DEFAULT_FILTERS)}>
          Reset
        </button>
      </div>

      <section>
        <h3>Level</h3>
        <div className="chips">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`chip ${filters.levels.includes(l) ? 'on' : ''}`}
              onClick={() => set({ levels: toggle(filters.levels, l) })}
            >
              {colorBy === 'level' && <span className="dot" style={{ background: LEVEL_COLORS[l] }} />}
              {l}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Format</h3>
        <div className="chips">
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              className={`chip ${filters.disciplines.includes(d) ? 'on' : ''}`}
              onClick={() => set({ disciplines: toggle(filters.disciplines, d) })}
            >
              {colorBy === 'format' && <span className="dot" style={{ background: FORMAT_COLORS[d] }} />}
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Month</h3>
        <div className="chips">
          {allItems('month', races).map((m) => (
            <button
              key={m.key}
              className={`chip ${filters.months.includes(m.key) ? 'on' : ''}`}
              onClick={() => set({ months: toggle(filters.months, m.key) })}
            >
              {colorBy === 'month' && <span className="dot" style={{ background: m.color }} />}
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>More</h3>
        <label className="check">
          <input type="checkbox" checked={filters.nightOnly} onChange={(e) => set({ nightOnly: e.target.checked })} />
          Night races only
        </label>
        <label className="check">
          <input type="checkbox" checked={filters.hideSeries} onChange={(e) => set({ hideSeries: e.target.checked })} />
          Show weekly series once
        </label>
      </section>

      <p className="official-note">
        Dates and details can change. Check the{' '}
        <a href="https://www.ski-alpinisme.fr/calendrier" target="_blank" rel="noopener noreferrer">
          official calendar on ski-alpinisme.fr ↗
        </a>{' '}
        for the latest information.
      </p>
    </aside>
  )
}
