import type { Home, Level, Race } from './types'

export interface Filters {
  search: string
  levels: Level[] // empty = all
  disciplines: string[] // empty = all
  maxKm: number | null // null = any distance
  from: string // YYYY-MM-DD, '' = no lower bound
  to: string
  nightOnly: boolean
  includeTbc: boolean
  hideSeries: boolean // collapse weekly series (e.g. Millet Courchevel) to their first date
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  levels: [],
  disciplines: [],
  maxKm: 200,
  from: '',
  to: '',
  nightOnly: false,
  includeTbc: true,
  hideSeries: false,
}

export const DEFAULT_HOME: Home = { name: 'Mercury', lat: 45.683, lon: 6.333 }

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = (d: number) => (d * Math.PI) / 180
  const dLat = r(bLat - aLat)
  const dLon = r(bLon - aLon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function raceDistance(race: Race, home: Home): number | null {
  if (race.lat == null || race.lon == null) return null
  return distanceKm(home.lat, home.lon, race.lat, race.lon)
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Series key: same name at the same place, ignoring the date. */
export const seriesKey = (r: Race) => `${r.name.replace(/\s+–\s+Finale$/, '')}|${r.location}`

export function applyFilters(races: Race[], f: Filters, home: Home): Race[] {
  const q = normalise(f.search.trim())
  const seen = new Set<string>()
  return races.filter((r) => {
    if (q && !normalise(`${r.name} ${r.location} ${r.region ?? ''} ${r.country} ${r.details ?? ''}`).includes(q))
      return false
    if (f.levels.length && !f.levels.includes(r.level)) return false
    if (f.disciplines.length && !r.disciplines.some((d) => f.disciplines.includes(d))) return false
    if (f.nightOnly && !r.is_night) return false
    if (!r.start_date) {
      if (!f.includeTbc) return false
    } else {
      const end = r.end_date ?? r.start_date
      if (f.from && end < f.from) return false
      if (f.to && r.start_date > f.to) return false
    }
    if (f.maxKm != null) {
      const d = raceDistance(r, home)
      if (d == null || d > f.maxKm) return false
    }
    if (f.hideSeries) {
      const k = seriesKey(r)
      if (seen.has(k)) return false
      seen.add(k)
    }
    return true
  })
}

export function placeKey(r: Race): string | null {
  return r.lat == null || r.lon == null ? null : `${r.lat},${r.lon}`
}

export function formatDateRange(r: Race): string {
  if (!r.start_date) return 'Date TBC'
  const fmt = (s: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${s}T12:00:00`).toLocaleDateString('en-GB', opts)
  const full: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  if (!r.end_date || r.end_date === r.start_date) return fmt(r.start_date, full)
  return `${fmt(r.start_date, { weekday: 'short', day: 'numeric', month: 'short' })} – ${fmt(r.end_date, full)}`
}
