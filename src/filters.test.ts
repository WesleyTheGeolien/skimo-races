import { describe, expect, it } from 'vitest'
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, isPast, nextRace, todayIso, type Filters } from './filters'
import type { Race } from './types'

const race = (id: string, start_date: string | null, end_date: string | null = null) =>
  ({ id, start_date, end_date }) as Race

describe('nextRace', () => {
  const today = '2026-12-10'

  it('picks the earliest race that has not finished yet', () => {
    const races = [race('later', '2027-01-05'), race('past', '2026-11-01'), race('soon', '2026-12-20')]
    expect(nextRace(races, today)?.id).toBe('soon')
  })

  it('counts a race running today as not finished', () => {
    expect(nextRace([race('past', '2026-11-01'), race('now', '2026-12-09', '2026-12-11')], today)?.id).toBe('now')
  })

  it('falls back to the first race when all are past', () => {
    expect(nextRace([race('b', '2026-02-01'), race('a', '2026-01-01')], today)?.id).toBe('a')
  })

  it('falls back to an undated race when it is the only one', () => {
    expect(nextRace([race('tbc', null)], today)?.id).toBe('tbc')
  })

  it('returns undefined for no races', () => {
    expect(nextRace([], today)).toBeUndefined()
  })
})

describe('isPast', () => {
  const today = '2026-12-10'
  it('is true only once the last day is before today', () => {
    expect(isPast(race('a', '2026-12-09'), today)).toBe(true)
    expect(isPast(race('a', '2026-12-10'), today)).toBe(false)
    expect(isPast(race('a', '2026-12-08', '2026-12-10'), today)).toBe(false)
    expect(isPast(race('a', '2026-12-01', '2026-12-09'), today)).toBe(true)
  })
  it('never treats undated races as past', () => {
    expect(isPast(race('a', null), today)).toBe(false)
  })
})

describe('todayIso', () => {
  it('formats the local date', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('applyFilters', () => {
  it('ignores dates, even stale persisted from/to/includeTbc values', () => {
    const r = (id: string, start_date: string | null) =>
      ({ id, start_date, end_date: null, name: id, location: id, country: 'FR', level: 'National', disciplines: [], is_night: false }) as unknown as Race
    const races = [r('tbc', null), r('early', '2026-01-01'), r('late', '2027-03-01')]
    const stale = { ...DEFAULT_FILTERS, from: '2026-06-01', to: '2026-12-31', includeTbc: false } as Filters
    expect(applyFilters(races, stale).map((x) => x.id)).toEqual(['tbc', 'early', 'late'])
  })
})

describe('activeFilterCount', () => {
  it('is zero for the defaults, whatever the search', () => {
    expect(activeFilterCount({ ...DEFAULT_FILTERS, search: 'courchevel' })).toBe(0)
  })

  it('counts each chip and each checkbox', () => {
    const f: Filters = { ...DEFAULT_FILTERS, levels: ['Classic', 'Promo'], months: ['1'], nightOnly: true }
    expect(activeFilterCount(f)).toBe(4)
  })
})
