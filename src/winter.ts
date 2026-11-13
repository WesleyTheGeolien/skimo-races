/**
 * Winter look for Mapbox's outdoors-v12 style: snow-white land, pale blue-grey forest,
 * icy water, cool hillshade, plus OpenSnowMap's piste and lift overlay.
 * Mapbox publishes no winter style, so we recolour outdoors (which keeps contours and terrain).
 */

/** The parts of mapboxgl.Map this module uses, so it can be tested without WebGL. */
export interface WinterMap {
  getLayer(id: string): unknown
  setPaintProperty(id: string, prop: string, value: unknown): unknown
  getStyle(): { layers?: { id: string; type: string }[] } | undefined
  getSource(id: string): unknown
  addSource(id: string, source: object): unknown
  addLayer(layer: object, beforeId?: string): unknown
}

const SNOW = 'hsl(210, 30%, 98%)'

export const WINTER_PAINT: [layer: string, prop: string, value: unknown][] = [
  ['land', 'background-color', SNOW],
  ['land-structure-polygon', 'fill-color', SNOW],
  ['road-pedestrian-polygon-fill', 'fill-color', SNOW],
  [
    'landcover',
    'fill-color',
    ['match', ['get', 'class'], 'wood', 'hsla(200, 18%, 80%, 0.8)', 'scrub', 'hsla(200, 18%, 86%, 0.6)', 'hsla(210, 30%, 96%, 0.6)'],
  ],
  ['landuse', 'fill-color', ['match', ['get', 'class'], 'wood', 'hsla(200, 18%, 80%, 0.6)', 'hsla(210, 25%, 93%, 0.5)']],
  ['national-park', 'fill-color', 'hsl(200, 25%, 93%)'],
  ['water', 'fill-color', 'hsl(203, 55%, 78%)'],
  ['water-shadow', 'fill-color', 'hsl(208, 50%, 70%)'],
  ['wetland', 'fill-color', 'hsl(200, 25%, 88%)'],
  ['wetland-pattern', 'fill-color', 'hsl(200, 25%, 88%)'],
  [
    'hillshade',
    'fill-color',
    ['match', ['get', 'class'], 'shadow', 'hsla(215, 40%, 35%, 0.14)', 'hsla(0, 0%, 100%, 0.35)'],
  ],
  ['building', 'fill-color', 'hsl(210, 12%, 82%)'],
]

export const PISTES_SOURCE = 'opensnowmap-pistes'

export function applyWinterTheme(map: WinterMap): void {
  for (const [layer, prop, value] of WINTER_PAINT) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop, value)
  }
  if (map.getSource(PISTES_SOURCE)) return
  map.addSource(PISTES_SOURCE, {
    type: 'raster',
    tiles: ['https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png'],
    tileSize: 256,
    maxzoom: 18,
    attribution: '© <a href="https://www.opensnowmap.org">OpenSnowMap</a> (CC-BY-SA)',
  })
  // Under the base style's labels, so place names stay readable.
  const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id
  map.addLayer({ id: 'pistes', type: 'raster', source: PISTES_SOURCE, minzoom: 9, paint: { 'raster-opacity': 0.9 } }, firstSymbol)
}
