import { describe, expect, it } from 'vitest'
import { groupByMonth, shortDay } from './compact'
import type { Race } from './types'

const race = (id: string, start_date: string | null, end_date: string | null = null): Race => ({
  id,
  name: id,
  start_date,
  end_date,
  status: 'Confirmed',
  location: 'Somewhere',
  region: null,
  country: 'France',
  details: null,
  url: null,
  lat: null,
  lon: null,
  level: 'Regional',
  disciplines: [],
  is_night: false,
})

describe('groupByMonth', () => {
  it('groups by start month in input order and puts undated races last', () => {
    const groups = groupByMonth([
      race('a', '2026-12-05'),
      race('b', '2026-12-20'),
      race('c', '2027-01-10'),
      race('d', null),
    ])
    expect(groups.map((g) => [g.key, g.label, g.races.map((r) => r.id)])).toEqual([
      ['2026-12', 'December 2026', ['a', 'b']],
      ['2027-01', 'January 2027', ['c']],
      ['tbc', 'No date yet', ['d']],
    ])
  })

  it('returns no groups for no races', () => {
    expect(groupByMonth([])).toEqual([])
  })
})

describe('shortDay', () => {
  it('shows weekday and day for a one-day race', () => {
    expect(shortDay(race('a', '2026-12-05'))).toBe('Sat 5')
    expect(shortDay(race('a', '2026-12-05', '2026-12-05'))).toBe('Sat 5')
  })

  it('shows a day range for a multi-day race', () => {
    expect(shortDay(race('a', '2026-12-05', '2026-12-07'))).toBe('5–7')
  })

  it('adds the end month when a race crosses months', () => {
    expect(shortDay(race('a', '2026-12-30', '2027-01-02'))).toBe('30–2 Jan')
  })

  it('shows TBC when there is no date', () => {
    expect(shortDay(race('a', null))).toBe('TBC')
  })
})
