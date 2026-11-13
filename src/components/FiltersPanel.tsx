import { useState } from 'react'
import { DEFAULT_FILTERS, type Filters } from '../filters'
import { DISCIPLINES, LEVEL_COLORS, LEVELS, type Home } from '../types'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  home: Home
  onHomeChange: (h: Home) => void
  shown: number
  total: number
}

const DISTANCES: (number | null)[] = [25, 50, 100, 150, 200, 400, null]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function FiltersPanel({ filters, onChange, home, onHomeChange, shown, total }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const [editingHome, setEditingHome] = useState(false)
  const [homeDraft, setHomeDraft] = useState({ name: home.name, lat: String(home.lat), lon: String(home.lon) })

  const saveHome = () => {
    const lat = Number(homeDraft.lat)
    const lon = Number(homeDraft.lon)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      onHomeChange({ name: homeDraft.name || 'Home', lat, lon })
      setEditingHome(false)
    }
  }

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

      <input
        className="search"
        type="search"
        placeholder="Search race, town, region…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />

      <section>
        <h3>Distance from {home.name}</h3>
        <div className="chips">
          {DISTANCES.map((d) => (
            <button
              key={String(d)}
              className={`chip ${filters.maxKm === d ? 'on' : ''}`}
              onClick={() => set({ maxKm: d })}
            >
              {d == null ? 'Any' : `${d} km`}
            </button>
          ))}
        </div>
        {editingHome ? (
          <div className="home-edit">
            <input value={homeDraft.name} onChange={(e) => setHomeDraft({ ...homeDraft, name: e.target.value })} />
            <input
              value={homeDraft.lat}
              inputMode="decimal"
              placeholder="lat"
              onChange={(e) => setHomeDraft({ ...homeDraft, lat: e.target.value })}
            />
            <input
              value={homeDraft.lon}
              inputMode="decimal"
              placeholder="lon"
              onChange={(e) => setHomeDraft({ ...homeDraft, lon: e.target.value })}
            />
            <button onClick={saveHome}>Save</button>
          </div>
        ) : (
          <button className="link small" onClick={() => setEditingHome(true)}>
            Change home ({home.lat.toFixed(3)}, {home.lon.toFixed(3)})
          </button>
        )}
      </section>

      <section>
        <h3>Dates</h3>
        <div className="dates">
          <label>
            From <input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label>
            To <input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={filters.includeTbc} onChange={(e) => set({ includeTbc: e.target.checked })} />
          Include races with no date yet
        </label>
      </section>

      <section>
        <h3>Level</h3>
        <div className="chips">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`chip ${filters.levels.includes(l) ? 'on' : ''}`}
              onClick={() => set({ levels: toggle(filters.levels, l) })}
            >
              <span className="dot" style={{ background: LEVEL_COLORS[l] }} />
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
              {d}
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
    </aside>
  )
}
