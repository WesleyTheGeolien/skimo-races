import { useMemo, useState } from 'react'
import { CalendarView } from './components/CalendarView'
import { DetailPanel } from './components/DetailPanel'
import { FiltersPanel } from './components/FiltersPanel'
import { ListView } from './components/ListView'
import { MapView } from './components/MapView'
import { RACES } from './data'
import { applyFilters, DEFAULT_FILTERS, DEFAULT_HOME, type Filters } from './filters'
import type { Home, Race, Selection } from './types'

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
  const [home, setHome] = usePersisted<Home>('skimo.home', DEFAULT_HOME)
  const [view, setView] = useState<View>('map')
  const [selection, setSelection] = useState<Selection>(null)

  const filtered = useMemo(() => applyFilters(races, filters, home), [races, filters, home])

  return (
    <div className="app">
      <header>
        <h1>⛷ Skimo races</h1>
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
          home={home}
          onHomeChange={setHome}
          shown={filtered.length}
          total={races.length}
        />
        <main>
          {view === 'map' && <MapView races={filtered} home={home} selection={selection} onSelect={setSelection} />}
          {view === 'calendar' && <CalendarView races={filtered} selection={selection} onSelect={setSelection} />}
          {view === 'list' && <ListView races={filtered} home={home} selection={selection} onSelect={setSelection} />}
        </main>
        <DetailPanel races={races} selection={selection} onSelect={setSelection} home={home} />
      </div>
    </div>
  )
}
