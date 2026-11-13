import mapboxgl from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef } from 'react'
import { placeKey } from '../filters'
import { placeColor, type ColorBy } from '../colors'
import type { Race, Selection } from '../types'
import { EmptyState } from './Logo'
import { applyWinterTheme } from '../winter'
import { DOT_PAINT, HALO_PAINT } from '../markerStyle'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

/** Initial view: the French Alps, from the Mercantour to Lake Geneva. */
const FRENCH_ALPS: mapboxgl.LngLatBoundsLike = [
  [5.2, 43.7],
  [7.8, 46.5],
]

interface Props {
  races: Race[]
  selection: Selection
  onSelect: (s: Selection) => void
  colorBy: ColorBy
  /** Phone layout: race details cover the bottom of the map in a sheet. */
  mobile?: boolean
}

/** Pixels around a click or tap that still count as hitting a dot. */
const TAP_SLOP_MOUSE = 4
const TAP_SLOP_TOUCH = 14
/** Share of the map height the details sheet covers on a phone; the picked dot is centred above it. */
const SHEET_SHARE = 0.45

/** One feature per place, so a venue with many dates (Courchevel) is one dot sized by count. */
function toGeoJSON(races: Race[], colorBy: ColorBy): FeatureCollection<Point> {
  const byPlace = new Map<string, Race[]>()
  for (const r of races) {
    const k = placeKey(r)
    if (!k) continue
    byPlace.set(k, [...(byPlace.get(k) ?? []), r])
  }
  return {
    type: 'FeatureCollection',
    features: [...byPlace.entries()].map(([key, list]) => {
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [list[0].lon!, list[0].lat!] },
        properties: { key, count: list.length, color: placeColor(list, colorBy), label: list[0].location },
      }
    }),
  }
}

export function MapView({ races, selection, onSelect, colorBy, mobile = false }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const ready = useRef(false)
  const geojson = useMemo(() => toGeoJSON(races, colorBy), [races, colorBy])
  const geojsonRef = useRef(geojson)
  geojsonRef.current = geojson
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const mobileRef = useRef(mobile)
  mobileRef.current = mobile

  useEffect(() => {
    if (!TOKEN || !container.current) return
    mapboxgl.accessToken = TOKEN
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      bounds: FRENCH_ALPS,
      fitBoundsOptions: { padding: 20 },
    })
    map.current = m
    m.addControl(new mapboxgl.NavigationControl(), 'top-right')
    m.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    m.on('load', () => {
      applyWinterTheme(m)
      m.addSource('races', { type: 'geojson', data: geojsonRef.current })
      // A dark halo under the dots keeps them apart from the piste overlay when zoomed in.
      m.addLayer({ id: 'race-halo', type: 'circle', source: 'races', paint: HALO_PAINT } as mapboxgl.CircleLayerSpecification)
      m.addLayer({ id: 'race-dots', type: 'circle', source: 'races', paint: DOT_PAINT } as mapboxgl.CircleLayerSpecification)
      m.addLayer({
        id: 'race-counts',
        type: 'symbol',
        source: 'races',
        filter: ['>', ['get', 'count'], 1],
        layout: { 'text-field': ['to-string', ['get', 'count']], 'text-size': 11, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' },
      })
      m.addLayer({
        id: 'race-labels',
        type: 'symbol',
        source: 'races',
        minzoom: 7.5,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: { 'text-color': '#10233b', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
      })
      // Hit-test a box around the tap, not the exact pixel, so small dots are easy to hit with a finger.
      m.on('click', (e) => {
        const pad = mobileRef.current ? TAP_SLOP_TOUCH : TAP_SLOP_MOUSE
        const { x, y } = e.point
        const hits = m.queryRenderedFeatures(
          [
            [x - pad, y - pad],
            [x + pad, y + pad],
          ],
          { layers: ['race-dots'] },
        )
        const key = hits[0]?.properties?.key as string | undefined
        if (key) onSelectRef.current({ kind: 'place', key })
        // On a phone, a tap on empty map closes the details sheet.
        else if (mobileRef.current) onSelectRef.current(null)
      })
      m.on('mouseenter', 'race-dots', () => (m.getCanvas().style.cursor = 'pointer'))
      m.on('mouseleave', 'race-dots', () => (m.getCanvas().style.cursor = ''))
      ready.current = true
    })
    return () => {
      ready.current = false
      m.remove()
      map.current = null
    }
    // The map is created once; data is pushed in by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push filtered data; the view stays on the Alps.
  useEffect(() => {
    const m = map.current
    if (!m || !ready.current) return
    ;(m.getSource('races') as mapboxgl.GeoJSONSource | undefined)?.setData(geojson)
  }, [geojson]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to a race picked from the list or calendar.
  useEffect(() => {
    const m = map.current
    if (!m || !selection) return
    let lat: number | null | undefined, lon: number | null | undefined
    if (selection.kind === 'race') {
      const r = races.find((x) => x.id === selection.id)
      lat = r?.lat
      lon = r?.lon
    } else {
      ;[lat, lon] = selection.key.split(',').map(Number)
    }
    if (lat == null || lon == null) return
    const offsetY = mobile ? -(m.getContainer().clientHeight * SHEET_SHARE) / 2 : 0
    m.flyTo({ center: [lon, lat], zoom: Math.max(m.getZoom(), 9), duration: 800, offset: [0, offsetY] })
  }, [selection]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <EmptyState>
        Add your Mapbox token to <code>.env</code> as <code>VITE_MAPBOX_TOKEN</code> and restart{' '}
        <code>npm run dev</code> to see the map.
      </EmptyState>
    )
  }

  return (
    <div className="map-wrap">
      <div ref={container} className="map" />
    </div>
  )
}
