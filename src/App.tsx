import { useMemo, useState } from 'react'
import { type ColorBy } from './colors'
import { ColorKey } from './components/ColorKey'
import { CalendarView } from './components/CalendarView'
import { CompactList } from './components/CompactList'
import { DetailPanel } from './components/DetailPanel'
import { FiltersPanel } from './components/FiltersPanel'
import { ListView } from './components/ListView'
import { Logo } from './components/Logo'
import { MapView } from './components/MapView'
import { RACES } from './data'
import { applyFilters, DEFAULT_FILTERS, type Filters } from './filters'
import type { Race, Selection } from './types'

type View = 'map' | 'calendar' | 'list'

function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...initial, ...JSON.parse(raw) } : initial
    } catch {
      return initial
    }
  })
  const set = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }
  return [value, set]
}

const byDate = (a: Race, b: Race) =>
  (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999') || a.name.localeCompare(b.name)

export default function App() {
  const races = useMemo(() => [...RACES].sort(byDate), [])
  const [filters, setFilters] = usePersisted<Filters>('skimo.filters', DEFAULT_FILTERS)
  const [prefs, setPrefs] = usePersisted<{ colorBy: ColorBy }>('skimo.prefs', { colorBy: 'level' })
  const { colorBy } = prefs
  const [view, setView] = useState<View>('map')
  const [selection, setSelection] = useState<Selection>(null)

  const filtered = useMemo(() => applyFilters(races, filters), [races, filters])

  return (
    <div className="app">
      <header>
        <h1 className="brand">
          <Logo size={34} />
          <span>
            Skimo races
            <small>Ski-mountaineering in the French Alps · 2026–27</small>
          </span>
        </h1>
        <nav className="tabs">
          {(['map', 'calendar', 'list'] as View[]).map((v) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      <div className="body">
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          shown={filtered.length}
          total={races.length}
          races={races}
          colorBy={colorBy}
        />
        <main>
          {view === 'map' && <MapView races={filtered} selection={selection} onSelect={setSelection} colorBy={colorBy} />}
          {view === 'calendar' && <CalendarView races={filtered} selection={selection} onSelect={setSelection} colorBy={colorBy} />}
          {view === 'list' && <ListView races={filtered} selection={selection} onSelect={setSelection} colorBy={colorBy} />}
        </main>
        <aside className="sidebar">
          <div className="sidebar-search">
            <input
              className="search"
              type="search"
              placeholder="Search race, town, region…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <ColorKey
            races={races}
            filters={filters}
            onChange={setFilters}
            colorBy={colorBy}
            onColorBy={(c) => setPrefs({ ...prefs, colorBy: c })}
          />
          <DetailPanel races={races} selection={selection} onSelect={setSelection} colorBy={colorBy} />
          <CompactList races={filtered} selection={selection} onSelect={setSelection} colorBy={colorBy} />
        </aside>
      </div>
    </div>
  )
}
