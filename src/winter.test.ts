import { describe, expect, it } from 'vitest'
import { applyWinterTheme, PISTES_SOURCE, type WinterMap } from './winter'

function fakeMap(layerIds: string[]) {
  const paint: Record<string, unknown> = {}
  const sources = new Map<string, object>()
  const added: { layer: { id: string }; before?: string }[] = []
  const layers = layerIds.map((id) => ({ id, type: id.endsWith('-label') ? 'symbol' : 'fill' }))
  const map: WinterMap = {
    getLayer: (id) => layers.find((l) => l.id === id),
    setPaintProperty: (id, prop, v) => (paint[`${id}.${prop}`] = v),
    getStyle: () => ({ layers }),
    getSource: (id) => sources.get(id),
    addSource: (id, s) => sources.set(id, s),
    addLayer: (layer, before) => added.push({ layer: layer as { id: string }, before }),
  }
  return { map, paint, sources, added }
}

describe('applyWinterTheme', () => {
  it('recolours layers that exist and skips missing ones', () => {
    const { map, paint } = fakeMap(['land', 'water', 'place-label'])
    applyWinterTheme(map)
    expect(paint['land.background-color']).toBe('hsl(210, 30%, 98%)')
    expect(paint['water.fill-color']).toBeDefined()
    expect(Object.keys(paint).some((k) => k.startsWith('landcover'))).toBe(false)
  })

  it('adds the piste overlay below the first label layer, once', () => {
    const { map, sources, added } = fakeMap(['land', 'road-label', 'place-label'])
    applyWinterTheme(map)
    applyWinterTheme(map)
    expect(sources.has(PISTES_SOURCE)).toBe(true)
    expect(added).toEqual([{ layer: expect.objectContaining({ id: 'pistes' }), before: 'road-label' }])
  })
})
