import mapboxgl from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef } from 'react'
import { placeKey } from '../filters'
import { LEVEL_COLORS, LEVELS, type Home, type Race, type Selection } from '../types'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface Props {
  races: Race[]
  home: Home
  selection: Selection
  onSelect: (s: Selection) => void
}

/** One feature per place, so a venue with many dates (Courchevel) is one dot sized by count. */
function toGeoJSON(races: Race[]): FeatureCollection<Point> {
  const byPlace = new Map<string, Race[]>()
  for (const r of races) {
    const k = placeKey(r)
    if (!k) continue
    byPlace.set(k, [...(byPlace.get(k) ?? []), r])
  }
  return {
    type: 'FeatureCollection',
    features: [...byPlace.entries()].map(([key, list]) => {
      // Colour the dot by its most prestigious race.
      const top = LEVELS.find((l) => list.some((r) => r.level === l)) ?? 'Open'
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [list[0].lon!, list[0].lat!] },
        properties: { key, count: list.length, color: LEVEL_COLORS[top], label: list[0].location },
      }
    }),
  }
}

export function MapView({ races, home, selection, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const homeMarker = useRef<mapboxgl.Marker | null>(null)
  const ready = useRef(false)
  const geojson = useMemo(() => toGeoJSON(races), [races])
  const geojsonRef = useRef(geojson)
  geojsonRef.current = geojson
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!TOKEN || !container.current) return
    mapboxgl.accessToken = TOKEN
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [home.lon, home.lat],
      zoom: 7,
    })
    map.current = m
    m.addControl(new mapboxgl.NavigationControl(), 'top-right')
    m.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    m.on('load', () => {
      m.addSource('races', { type: 'geojson', data: geojsonRef.current })
      m.addLayer({
        id: 'race-dots',
        type: 'circle',
        source: 'races',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 7, 5, 11, 20, 17],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      })
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
        paint: { 'text-color': '#1f2937', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
      })
      m.on('click', 'race-dots', (e) => {
        const key = e.features?.[0]?.properties?.key as string | undefined
        if (key) onSelectRef.current({ kind: 'place', key })
      })
      m.on('mouseenter', 'race-dots', () => (m.getCanvas().style.cursor = 'pointer'))
      m.on('mouseleave', 'race-dots', () => (m.getCanvas().style.cursor = ''))
      ready.current = true
      fit(m, geojsonRef.current, home)
    })
    return () => {
      ready.current = false
      m.remove()
      map.current = null
    }
    // The map is created once; data and home are pushed in by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push filtered data and refit when the set of places changes.
  useEffect(() => {
    const m = map.current
    if (!m || !ready.current) return
    ;(m.getSource('races') as mapboxgl.GeoJSONSource | undefined)?.setData(geojson)
    fit(m, geojson, home)
  }, [geojson]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current
    if (!m) return
    homeMarker.current?.remove()
    const el = document.createElement('div')
    el.className = 'home-marker'
    el.title = home.name
    homeMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([home.lon, home.lat]).addTo(m)
  }, [home])

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
    if (lat != null && lon != null) m.flyTo({ center: [lon, lat], zoom: Math.max(m.getZoom(), 9), duration: 800 })
  }, [selection]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <div className="map-missing">
        <p>
          Add your Mapbox token to <code>.env</code> as <code>VITE_MAPBOX_TOKEN</code> and restart{' '}
          <code>npm run dev</code> to see the map.
        </p>
      </div>
    )
  }

  return (
    <div className="map-wrap">
      <div ref={container} className="map" />
      <div className="legend">
        {LEVELS.map((l) => (
          <span key={l}>
            <span className="dot" style={{ background: LEVEL_COLORS[l] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

function fit(m: mapboxgl.Map, data: FeatureCollection<Point>, home: Home) {
  const b = new mapboxgl.LngLatBounds([home.lon, home.lat], [home.lon, home.lat])
  data.features.forEach((f) => b.extend(f.geometry.coordinates as [number, number]))
  m.fitBounds(b, { padding: 60, maxZoom: 10, duration: 600 })
}
