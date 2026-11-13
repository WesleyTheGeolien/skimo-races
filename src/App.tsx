import { useEffect, useRef, useState, useMemo } from 'react'
import { type ColorBy } from './colors'
import { ColorKey } from './components/ColorKey'
import { CalendarView } from './components/CalendarView'
import { CompactList } from './components/CompactList'
import { DetailPanel } from './components/DetailPanel'
import { FiltersPanel } from './components/FiltersPanel'
import { ListView } from './components/ListView'
import { Logo } from './components/Logo'
import { MapView } from './components/MapView'
import { Sheet } from './components/Sheet'
import { RACES } from './data'
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, type Filters } from './filters'
import { OFFICIAL_CALENDAR_URL, type Race, type Selection } from './types'
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery'

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
  const mobile = useMediaQuery(MOBILE_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Keep the last race on screen while the details sheet slides away.
  const shownSelection = useRef<Selection>(null)
  if (selection) shownSelection.current = selection

  // Leaving the phone layout: its sheets no longer exist.
  useEffect(() => {
    if (!mobile) setFiltersOpen(false)
  }, [mobile])

  const viewProps = { races: filtered, selection, onSelect: setSelection, colorBy }
  const search = (
    <input
      className="search"
      type="search"
      enterKeyHint="search"
      placeholder="Search race, town, region…"
      aria-label="Search races"
      value={filters.search}
      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
    />
  )
  const colorKey = (
    <ColorKey
      races={races}
      filters={filters}
      onChange={setFilters}
      colorBy={colorBy}
      onColorBy={(c) => setPrefs({ ...prefs, colorBy: c })}
    />
  )
  const filtersPanel = (
    <FiltersPanel
      filters={filters}
      onChange={setFilters}
      shown={filtered.length}
      total={races.length}
      races={races}
      colorBy={colorBy}
    />
  )
  const nFilters = activeFilterCount(filters)

  return (
    <div className={`app ${mobile ? 'mobile' : ''} ${mobile && selection ? 'has-detail' : ''}`}>
      <header>
        <h1 className="brand">
          <Logo size={mobile ? 28 : 34} />
          <span>
            Skimo races
            <small>Ski-mountaineering in the French Alps · 2026–27</small>
          </span>
        </h1>
        {!mobile && (
          <a className="official-link" href={OFFICIAL_CALENDAR_URL} target="_blank" rel="noopener noreferrer">
            Official calendar ↗
          </a>
        )}
        <nav className="tabs">
          {(['map', 'calendar', 'list'] as View[]).map((v) => (
            <button key={v} className={view === v ? 'on' : ''} aria-current={view === v} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      {mobile && (
        <div className="mobile-bar">
          {search}
          <button className={`filters-button ${nFilters ? 'on' : ''}`} onClick={() => setFiltersOpen(true)}>
            Filters{nFilters > 0 && <span className="filters-count">{nFilters}</span>}
          </button>
        </div>
      )}
      <div className="body">
        {!mobile && filtersPanel}
        <main>
          {view === 'map' && <MapView {...viewProps} mobile={mobile} />}
          {view === 'calendar' && <CalendarView {...viewProps} mobile={mobile} />}
          {view === 'list' && (mobile ? <CompactList {...viewProps} /> : <ListView {...viewProps} />)}
        </main>
        {!mobile && (
          <aside className="sidebar">
            <div className="sidebar-search">{search}</div>
            {colorKey}
            <DetailPanel races={races} selection={selection} onSelect={setSelection} colorBy={colorBy} />
            <CompactList {...viewProps} />
          </aside>
        )}
      </div>
      {mobile && (
        <>
          <Sheet
            modal
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            label="Filters"
            className="filters-sheet"
            footer={
              <button className="button block" onClick={() => setFiltersOpen(false)}>
                Show {filtered.length} {filtered.length === 1 ? 'race' : 'races'}
              </button>
            }
          >
            {colorKey}
            {filtersPanel}
          </Sheet>
          <Sheet
            open={!!selection}
            onClose={() => setSelection(null)}
            label="Race details"
            className="detail-sheet"
            scrollKey={JSON.stringify(selection)}
          >
            <DetailPanel
              races={races}
              selection={shownSelection.current}
              onSelect={setSelection}
              colorBy={colorBy}
            />
          </Sheet>
        </>
      )}
    </div>
  )
}
