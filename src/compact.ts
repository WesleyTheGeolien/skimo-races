import type { Race } from './types'

export interface MonthGroup {
  key: string // YYYY-MM, or 'tbc' for races with no date yet
  label: string
  races: Race[]
}

const day = (s: string) => new Date(`${s}T12:00:00`)

/** Groups date-sorted races by start month; undated races go last under "No date yet". */
export function groupByMonth(races: Race[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>()
  const tbc: Race[] = []
  for (const r of races) {
    if (!r.start_date) {
      tbc.push(r)
      continue
    }
    const key = r.start_date.slice(0, 7)
    let g = groups.get(key)
    if (!g) {
      g = { key, label: day(r.start_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), races: [] }
      groups.set(key, g)
    }
    g.races.push(r)
  }
  const out = [...groups.values()]
  if (tbc.length) out.push({ key: 'tbc', label: 'No date yet', races: tbc })
  return out
}

/** Short day label for a row under a month header: "Sat 13", or "13–15" for multi-day races. */
export function shortDay(r: Race): string {
  if (!r.start_date) return 'TBC'
  const s = day(r.start_date)
  if (!r.end_date || r.end_date === r.start_date) {
    return `${s.toLocaleDateString('en-GB', { weekday: 'short' })} ${s.getDate()}`
  }
  const e = day(r.end_date)
  if (e.getMonth() !== s.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${e.toLocaleDateString('en-GB', { month: 'short' })}`
  }
  return `${s.getDate()}–${e.getDate()}`
}
