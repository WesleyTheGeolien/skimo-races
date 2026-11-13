import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { colorFor, colorKeyItems, FORMAT_COLORS, legendFor, PAST_COLOR, placeColor, toggleKey } from './colors'
import { applyFilters, DEFAULT_FILTERS } from './filters'
import { LEVEL_COLORS, type Race } from './types'

const race = (over: Partial<Race>): Race => ({
  id: 'x',
  name: 'Race',
  start_date: '2027-01-10',
  end_date: null,
  status: 'Confirmed',
  location: 'Somewhere',
  region: null,
  country: 'France',
  details: null,
  url: null,
  lat: 45,
  lon: 6,
  level: 'Regional',
  disciplines: ['Vertical'],
  is_night: false,
  ...over,
})

// Past races are grey, so pin "today" before every date used below.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 1, 12))
})
afterAll(() => vi.useRealTimers())

describe('past races', () => {
  it('are grey in every colour mode', () => {
    const past = race({ start_date: '2026-10-20' })
    for (const by of ['level', 'format', 'month'] as const) expect(colorFor(past, by)).toBe(PAST_COLOR)
  })

  it('stay coloured on their last day and when undated', () => {
    expect(colorFor(race({ start_date: '2026-10-30', end_date: '2026-11-01' }), 'level')).toBe(LEVEL_COLORS.Regional)
    expect(colorFor(race({ start_date: null, level: 'Open' }), 'level')).toBe(LEVEL_COLORS.Open)
  })

  it('a map dot takes its colour from the races still to come', () => {
    const past = race({ id: 'p', start_date: '2026-10-01', level: 'International' })
    const next = race({ id: 'n', start_date: '2027-01-01', level: 'Open' })
    expect(placeColor([past, next], 'level')).toBe(LEVEL_COLORS.Open)
    expect(placeColor([past], 'level')).toBe(PAST_COLOR)
  })
})

describe('colorFor', () => {
  it('colours by level', () => {
    expect(colorFor(race({ level: 'Classic' }), 'level')).toBe(LEVEL_COLORS.Classic)
  })

  it('colours by first listed discipline, grey when none', () => {
    expect(colorFor(race({ disciplines: ['Sprint', 'Relay'] }), 'format')).toBe(FORMAT_COLORS.Sprint)
    expect(colorFor(race({ disciplines: [] }), 'format')).toBe('#9ca3af')
  })

  it('colours by start month, grey when undated', () => {
    const jan = colorFor(race({ start_date: '2027-01-03' }), 'month')
    expect(colorFor(race({ start_date: '2027-01-28' }), 'month')).toBe(jan)
    expect(colorFor(race({ start_date: '2027-02-01' }), 'month')).not.toBe(jan)
    expect(colorFor(race({ start_date: null }), 'month')).toBe('#9ca3af')
  })
})

describe('placeColor', () => {
  it('uses the most prestigious level', () => {
    const list = [race({ level: 'Open' }), race({ level: 'International' }), race({ level: 'Open' })]
    expect(placeColor(list, 'level')).toBe(LEVEL_COLORS.International)
  })

  it('uses the most common value for format and month, ties to the earliest', () => {
    const list = [race({ disciplines: ['Team'] }), race({ disciplines: ['Sprint'] }), race({ disciplines: ['Sprint'] })]
    expect(placeColor(list, 'format')).toBe(FORMAT_COLORS.Sprint)
    const tie = [race({ start_date: '2026-12-20' }), race({ start_date: '2027-03-01' })]
    expect(placeColor(tie, 'month')).toBe(colorFor(tie[0], 'month'))
  })
})

describe('legendFor', () => {
  it('lists months in season order, Date TBC last', () => {
    const labels = legendFor('month').map((i) => i.label)
    expect(labels[0]).toBe('November')
    expect(labels.indexOf('December')).toBeLessThan(labels.indexOf('January'))
    expect(labels.at(-1)).toBe('Date TBC')
  })

  it('keeps only values present in the given races', () => {
    const items = legendFor('format', [race({ disciplines: ['Relay'] }), race({ disciplines: [] })])
    expect(items.map((i) => i.label)).toEqual(['Relay', 'Unspecified'])
  })
})

describe('month and format filters', () => {
  const races = [
    race({ id: 'dec', start_date: '2026-12-20', disciplines: ['Sprint', 'Relay'] }),
    race({ id: 'jan', start_date: '2027-01-10', disciplines: [] }),
    race({ id: 'tbc', start_date: null }),
  ]
  const ids = (f: Partial<typeof DEFAULT_FILTERS>) => applyFilters(races, { ...DEFAULT_FILTERS, ...f }).map((r) => r.id)

  it('filters by start month, with none for undated races', () => {
    expect(ids({ months: ['1'] })).toEqual(['jan'])
    expect(ids({ months: ['12', 'none'] })).toEqual(['dec', 'tbc'])
  })

  it('matches any listed discipline, and none for races without one', () => {
    expect(ids({ disciplines: ['Relay'] })).toEqual(['dec'])
    expect(ids({ disciplines: ['none'] })).toEqual(['jan'])
  })
})

describe('colorKeyItems', () => {
  const races = [
    race({ id: 'a', level: 'Regional', start_date: '2027-01-10', disciplines: ['Sprint', 'Relay'] }),
    race({ id: 'b', level: 'Open', start_date: '2027-01-12' }),
    race({ id: 'c', level: 'Open', start_date: '2027-02-02' }),
  ]

  it('counts each value against the other filters only', () => {
    const f = { ...DEFAULT_FILTERS, months: ['1'], levels: ['Open' as const] }
    const items = colorKeyItems(races, f, 'month')
    expect(items.map((i) => [i.label, i.count, i.on])).toEqual([
      ['January', 1, true],
      ['February', 1, false],
    ])
  })

  it('lists a format used only as a second discipline', () => {
    expect(colorKeyItems(races, DEFAULT_FILTERS, 'format').map((i) => i.key)).toContain('Relay')
  })

  it('toggles the filter for the current mode', () => {
    const on = toggleKey(DEFAULT_FILTERS, 'format', 'Sprint')
    expect(on.disciplines).toEqual(['Sprint'])
    expect(toggleKey(on, 'format', 'Sprint').disciplines).toEqual([])
    expect(toggleKey(DEFAULT_FILTERS, 'level', 'Open').levels).toEqual(['Open'])
  })
})
