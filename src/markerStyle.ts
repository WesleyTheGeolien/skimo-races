/**
 * Paint for the race dots. From zoom 9 the OpenSnowMap piste overlay draws red, blue, black
 * and green lines that share the dots' colours, so the dots grow, go fully opaque and gain
 * a dark halo as you zoom in to stay distinguishable from the runs underneath.
 */

/** Zoom where the piste overlay starts and the dots begin to stand out. */
const Z_OVERVIEW = 8
const Z_PISTES = 11

/** Dot radius by race count at one place, scaled by `k`. */
const radiusByCount = (k: number) => ['interpolate', ['linear'], ['get', 'count'], 1, 7 * k, 5, 11 * k, 20, 17 * k]

/**
 * Radius by zoom, plus `extra` pixels at each end. Mapbox only allows ['zoom'] as the input
 * of a top-level interpolate, so offsets are baked into each stop rather than added outside.
 */
const radius = (extra: [number, number] = [0, 0]) => [
  'interpolate',
  ['linear'],
  ['zoom'],
  Z_OVERVIEW,
  ['+', radiusByCount(1), extra[0]],
  Z_PISTES,
  ['+', radiusByCount(1.35), extra[1]],
]

const STROKE: [number, number] = [2, 3]
const strokeWidth = ['interpolate', ['linear'], ['zoom'], Z_OVERVIEW, STROKE[0], Z_PISTES, STROKE[1]]

export const HALO_PAINT = {
  'circle-color': '#0a1c33',
  // Covers the white stroke and 4px beyond it.
  'circle-radius': radius([STROKE[0] + 4, STROKE[1] + 4]),
  'circle-blur': 0.5,
  'circle-opacity': ['interpolate', ['linear'], ['zoom'], Z_OVERVIEW, 0, Z_PISTES, 0.6],
}

export const DOT_PAINT = {
  'circle-color': ['get', 'color'],
  'circle-radius': radius(),
  'circle-stroke-color': '#fff',
  'circle-stroke-width': strokeWidth,
  'circle-opacity': ['interpolate', ['linear'], ['zoom'], Z_OVERVIEW, 0.9, Z_PISTES, 1],
}
