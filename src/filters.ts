import type { Level, Race } from './types'

export interface Filters {
  search: string
  levels: Level[] // empty = all
  disciplines: string[] // empty = all; 'none' matches races with no listed discipline
  months: string[] // month numbers '1'–'12', or 'none' for undated; empty = all
  nightOnly: boolean
  hideSeries: boolean // collapse weekly series (e.g. Millet Courchevel) to their first date
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  levels: [],
  disciplines: [],
  months: [],
  nightOnly: false,
  hideSeries: false,
}

/** How many filters differ from the defaults, search excluded (it has its own box). */
export function activeFilterCount(f: Filters): number {
  return (
    f.levels.length + f.disciplines.length + f.months.length + Number(f.nightOnly) + Number(f.hideSeries)
  )
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Start month as '1'–'12', or 'none' when the date is not set. */
export const monthKey = (r: Race): string => (r.start_date ? String(Number(r.start_date.slice(5, 7))) : 'none')

const disciplineKeys = (r: Race): string[] => (r.disciplines.length ? r.disciplines : ['none'])

/** Today's local date as YYYY-MM-DD. */
export const todayIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** A race whose last day is before `today`. Undated races are never past. */
export const isPast = (r: Race, today = todayIso()): boolean =>
  !!r.start_date && (r.end_date ?? r.start_date) < today

/** Series key: same name at the same place, ignoring the date. */
export const seriesKey = (r: Race) => `${r.name.replace(/\s+–\s+Finale$/, '')}|${r.location}`

export function applyFilters(races: Race[], f: Filters): Race[] {
  const q = normalise(f.search.trim())
  const seen = new Set<string>()
  return races.filter((r) => {
    if (q && !normalise(`${r.name} ${r.location} ${r.region ?? ''} ${r.country} ${r.details ?? ''}`).includes(q))
      return false
    if (f.levels.length && !f.levels.includes(r.level)) return false
    if (f.disciplines.length && !disciplineKeys(r).some((d) => f.disciplines.includes(d))) return false
    if (f.months.length && !f.months.includes(monthKey(r))) return false
    if (f.nightOnly && !r.is_night) return false
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

/** The first race (in date order) that has not finished by `today`, else the first race. */
export function nextRace(races: Race[], today = new Date().toISOString().slice(0, 10)): Race | undefined {
  const sorted = [...races].sort((a, b) => (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999'))
  return sorted.find((r) => r.start_date && (r.end_date ?? r.start_date) >= today) ?? sorted[0]
}

export function formatDateRange(r: Race): string {
  if (!r.start_date) return 'Date TBC'
  const fmt = (s: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${s}T12:00:00`).toLocaleDateString('en-GB', opts)
  const full: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  if (!r.end_date || r.end_date === r.start_date) return fmt(r.start_date, full)
  return `${fmt(r.start_date, { weekday: 'short', day: 'numeric', month: 'short' })} – ${fmt(r.end_date, full)}`
}
