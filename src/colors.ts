import { applyFilters, isPast, monthKey, type Filters } from './filters'
import { DISCIPLINES, LEVEL_COLORS, LEVELS, type Race } from './types'

export type ColorBy = 'level' | 'format' | 'month'

export const COLOR_BY_OPTIONS: { value: ColorBy; label: string }[] = [
  { value: 'level', label: 'Level' },
  { value: 'format', label: 'Format' },
  { value: 'month', label: 'Month' },
]

/** The filter list each colour mode toggles. */
export const FILTER_FIELD: Record<ColorBy, 'levels' | 'disciplines' | 'months'> = {
  level: 'levels',
  format: 'disciplines',
  month: 'months',
}

export interface LegendItem {
  key: string
  label: string
  color: string
}

const NONE = '#9ca3af'

export const FORMAT_COLORS: Record<string, string> = {
  Individual: '#1d4ed8',
  Team: '#7b2cbf',
  Vertical: '#d1495b',
  Sprint: '#ea580c',
  Relay: '#16a34a',
}

/** Ski season months in order (Nov → May), cold blues to spring greens. */
const SEASON_MONTHS: { month: number; color: string }[] = [
  { month: 11, color: '#64748b' },
  { month: 12, color: '#1d4ed8' },
  { month: 1, color: '#7b2cbf' },
  { month: 2, color: '#d1495b' },
  { month: 3, color: '#ea580c' },
  { month: 4, color: '#ca8a04' },
  { month: 5, color: '#16a34a' },
]
const OFF_SEASON = '#0891b2'

const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString('en-GB', { month: 'long' })

/** The format a race is coloured by: its first listed discipline. */
const primaryFormat = (r: Race): string | null => r.disciplines[0] ?? null

const raceMonth = (r: Race): number | null => (r.start_date ? Number(r.start_date.slice(5, 7)) : null)

function monthColor(m: number): string {
  return SEASON_MONTHS.find((s) => s.month === m)?.color ?? OFF_SEASON
}

/** The legend key a race falls under for this mode. */
export function colorKey(r: Race, by: ColorBy): string {
  if (by === 'level') return r.level
  if (by === 'format') return primaryFormat(r) ?? 'none'
  return monthKey(r)
}

/** Races that have already happened are grey in every view and colour mode. */
export const PAST_COLOR = '#c4c7cc'

export function colorFor(r: Race, by: ColorBy): string {
  if (isPast(r)) return PAST_COLOR
  if (by === 'level') return LEVEL_COLORS[r.level]
  if (by === 'format') {
    const f = primaryFormat(r)
    return f ? (FORMAT_COLORS[f] ?? NONE) : NONE
  }
  const m = raceMonth(r)
  return m == null ? NONE : monthColor(m)
}

/** Colour for a map dot covering several races at one place. */
export function placeColor(all: Race[], by: ColorBy): string {
  // Colour by the races still to come; grey once every race there is over.
  const races = all.filter((r) => !isPast(r))
  if (!races.length) return PAST_COLOR
  if (by === 'level') {
    // The most prestigious race wins.
    const top = LEVELS.find((l) => races.some((r) => r.level === l)) ?? 'Open'
    return LEVEL_COLORS[top]
  }
  // Otherwise the most common value, ties going to the earliest race.
  const counts = new Map<string, { n: number; race: Race }>()
  for (const r of races) {
    const k = colorKey(r, by)
    const c = counts.get(k)
    if (c) c.n++
    else counts.set(k, { n: 1, race: r })
  }
  let best: { n: number; race: Race } | undefined
  for (const c of counts.values()) if (!best || c.n > best.n) best = c
  return best ? colorFor(best.race, by) : NONE
}

/** Every value of the mode, in display order (months off the Nov–May season are added from `races`). */
export function allItems(by: ColorBy, races: Race[] = []): LegendItem[] {
  if (by === 'level') return LEVELS.map((l) => ({ key: l, label: l, color: LEVEL_COLORS[l] }))
  if (by === 'format')
    return [
      ...DISCIPLINES.map((d) => ({ key: d, label: d, color: FORMAT_COLORS[d] })),
      { key: 'none', label: 'Unspecified', color: NONE },
    ]
  const months = new Set(SEASON_MONTHS.map((s) => s.month))
  for (const r of races) {
    const m = raceMonth(r)
    if (m != null) months.add(m)
  }
  const order = (m: number) => (m - 8 + 12) % 12 // season starts in late summer
  return [
    ...[...months]
      .sort((a, b) => order(a) - order(b))
      .map((m) => ({ key: String(m), label: monthName(m), color: monthColor(m) })),
    { key: 'none', label: 'Date TBC', color: NONE },
  ]
}

/** Legend entries for the mode; with `races`, only the colours those races use. */
export function legendFor(by: ColorBy, races?: Race[]): LegendItem[] {
  const items = allItems(by, races)
  if (!races) return items
  const present = new Set(races.map((r) => colorKey(r, by)))
  return items.filter((i) => present.has(i.key))
}

export interface KeyItem extends LegendItem {
  count: number // races this chip would show on its own, given the other filters
  on: boolean
}

/**
 * The colour key for the mode, doubling as a filter on that dimension.
 * Counts ignore the mode's own filter, so unticked values still show what they would add.
 */
export function colorKeyItems(races: Race[], filters: Filters, by: ColorBy): KeyItem[] {
  const field = FILTER_FIELD[by]
  const selected = filters[field] as string[]
  return allItems(by, races)
    .map((i) => ({
      ...i,
      count: applyFilters(races, { ...filters, [field]: [i.key] }).length,
      on: selected.includes(i.key),
    }))
    .filter((i) => i.count > 0 || i.on)
}

/** Toggle one value of the mode's filter. */
export function toggleKey(filters: Filters, by: ColorBy, key: string): Filters {
  const field = FILTER_FIELD[by]
  const list = filters[field] as string[]
  const next = list.includes(key) ? list.filter((v) => v !== key) : [...list, key]
  return { ...filters, [field]: next }
}
