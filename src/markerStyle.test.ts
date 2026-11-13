import { describe, expect, it } from 'vitest'
import { DOT_PAINT, HALO_PAINT } from './markerStyle'

type Expr = unknown[]

/** Evaluates the small expression subset markerStyle uses, for one feature at one zoom. */
function evaluate(e: unknown, zoom: number, count: number): number {
  if (typeof e === 'number') return e
  const [op, ...args] = e as Expr
  if (op === 'zoom') return zoom
  if (op === 'get') return count
  if (op === '+') return args.reduce<number>((s, a) => s + evaluate(a, zoom, count), 0)
  if (op === 'interpolate') {
    const [, input, ...stops] = args
    const x = evaluate(input, zoom, count)
    const pts: [number, unknown][] = []
    for (let i = 0; i < stops.length; i += 2) pts.push([stops[i] as number, stops[i + 1]])
    if (x <= pts[0][0]) return evaluate(pts[0][1], zoom, count)
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      if (x <= x1) {
        const a = evaluate(y0, zoom, count)
        return a + ((x - x0) / (x1 - x0)) * (evaluate(y1, zoom, count) - a)
      }
    }
    return evaluate(pts[pts.length - 1][1], zoom, count)
  }
  throw new Error(`unsupported op ${String(op)}`)
}

/** Mapbox rejects ['zoom'] anywhere but as the input of a top-level interpolate/step. */
function zoomOnlyAtTop(e: unknown, top = true): boolean {
  if (!Array.isArray(e)) return true
  if (e[0] === 'zoom') return false
  if (e[0] === 'interpolate' && Array.isArray(e[2]) && e[2][0] === 'zoom') {
    return top && e.slice(3).every((x) => zoomOnlyAtTop(x, false))
  }
  return e.slice(1).every((x) => zoomOnlyAtTop(x, false))
}

describe('marker paint', () => {
  it('uses zoom only at the top level of each property', () => {
    for (const v of [...Object.values(DOT_PAINT), ...Object.values(HALO_PAINT)]) expect(zoomOnlyAtTop(v)).toBe(true)
  })

  it('keeps the original look at the overview zoom', () => {
    expect(evaluate(DOT_PAINT['circle-radius'], 7, 1)).toBe(7)
    expect(evaluate(DOT_PAINT['circle-radius'], 7, 20)).toBe(17)
    expect(evaluate(HALO_PAINT['circle-opacity'], 7, 1)).toBe(0)
  })

  it('makes dots bigger, opaque and haloed once pistes show', () => {
    for (const count of [1, 5, 20]) {
      const dot = evaluate(DOT_PAINT['circle-radius'], 12, count)
      const stroke = evaluate(DOT_PAINT['circle-stroke-width'], 12, count)
      expect(dot).toBeGreaterThan(evaluate(DOT_PAINT['circle-radius'], 7, count))
      expect(evaluate(HALO_PAINT['circle-radius'], 12, count)).toBeGreaterThan(dot + stroke)
    }
    expect(evaluate(DOT_PAINT['circle-opacity'], 12, 1)).toBe(1)
    expect(evaluate(HALO_PAINT['circle-opacity'], 12, 1)).toBeGreaterThan(0.5)
  })
})
