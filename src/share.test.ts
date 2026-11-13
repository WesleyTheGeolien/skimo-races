import { afterEach, describe, expect, it, vi } from 'vitest'
import { selectionFromUrl, shareRace, urlForSelection } from './share'
import type { Race } from './types'

const race = { id: 'abc', name: 'Pierra Menta', start_date: '2027-03-11', end_date: null, location: 'Arêches' } as Race
const BASE = 'https://example.github.io/skimo-races/'

describe('selectionFromUrl', () => {
  it('selects a known race', () => {
    expect(selectionFromUrl(`${BASE}?race=abc`, [race])).toEqual({ kind: 'race', id: 'abc' })
  })
  it('ignores unknown or missing races', () => {
    expect(selectionFromUrl(`${BASE}?race=nope`, [race])).toBeNull()
    expect(selectionFromUrl(BASE, [race])).toBeNull()
  })
})

describe('urlForSelection', () => {
  it('sets and clears the race parameter, keeping the rest of the URL', () => {
    const withRace = urlForSelection(`${BASE}?x=1#top`, { kind: 'race', id: 'abc' })
    expect(withRace).toBe(`${BASE}?x=1&race=abc#top`)
    expect(urlForSelection(withRace, null)).toBe(`${BASE}?x=1#top`)
    expect(urlForSelection(withRace, { kind: 'place', key: '1,2' })).toBe(`${BASE}?x=1#top`)
  })
})

describe('shareRace', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect(await shareRace(race, BASE)).toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pierra Menta', url: `${BASE}?race=abc` }))
  })

  it('reports a dismissed share sheet as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('no', 'AbortError'))
    vi.stubGlobal('navigator', { share })
    expect(await shareRace(race, BASE)).toBe('cancelled')
  })

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await shareRace(race, BASE)).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(`${BASE}?race=abc`)
  })

  it('fails when neither works', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    expect(await shareRace(race, BASE)).toBe('failed')
  })
})
