import { useEffect, useRef, useState, type FormEvent } from 'react'
import mapboxgl from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import { samplePlaces } from './samplePlaces'
import 'mapbox-gl/dist/mapbox-gl.css'
import './PriceMap.css'

const CONTIGUOUS_US: mapboxgl.LngLatBoundsLike = [[-125.5, 24], [-66, 49.8]]
const PAN_LIMIT: mapboxgl.LngLatBoundsLike = [[-130, 20], [-60, 53]]
const places: FeatureCollection<Point, { name: string }> = {
  type: 'FeatureCollection',
  features: samplePlaces.map(({ name, coords }) => ({
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Point', coordinates: coords },
  })),
}

// The original pin helpers weren't included; draw a crisp pin at twice its display size.
function makePinImage() {
  const canvas = document.createElement('canvas')
  // Leave transparent room around the pin so its shadow isn't clipped.
  canvas.width = 80
  canvas.height = 104
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')
  context.translate(8, 8)
  context.shadowColor = 'rgba(0, 0, 0, 0.4)'
  context.shadowBlur = 6
  context.shadowOffsetY = 3
  context.beginPath()
  context.moveTo(32, 84)
  context.bezierCurveTo(26, 72, 4, 51, 4, 30)
  context.arc(32, 30, 28, Math.PI, 0)
  context.bezierCurveTo(60, 51, 38, 72, 32, 84)
  context.fillStyle = '#7050bd'
  context.fill()
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

const bySize = (base: number): mapboxgl.ExpressionSpecification => [
  'step', ['get', 'point_count'], base, 10, base * 1.15, 50, base * 1.3,
]

function installLocationIcon(container: HTMLElement) {
  const observer = new MutationObserver(insertIcon)

  function insertIcon() {
    const icon = container.querySelector('.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon')
    if (!icon) return

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('width', '24')
    svg.setAttribute('height', '24')
    svg.setAttribute('aria-hidden', 'true')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M20.5 3.5 14.5 20.5 11.5 12.5 3.5 9.5Z')
    path.setAttribute('fill', 'currentColor')
    path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-linejoin', 'round')
    svg.append(path)
    icon.replaceChildren(svg)
    observer.disconnect()
  }

  // Mapbox adds this button after its asynchronous geolocation-support check.
  observer.observe(container, { childList: true, subtree: true })
  insertIcon()
  return () => observer.disconnect()
}

type PriceMapProps = {
  onReady: () => void
  isActive: boolean
}

export default function PriceMap({ onReady, isActive }: PriceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isActive) mainRef.current?.focus({ preventScroll: true })
  }, [isActive])

  useEffect(() => {
    const token = import.meta.env.REACT_APP_MAPBOX_TOKEN?.trim()
    if (!token || !containerRef.current) {
      setIsLoading(false)
      setMessage('Add REACT_APP_MAPBOX_TOKEN to frontend/.env, then restart the frontend.')
      onReady()
      return
    }

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        accessToken: token,
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        bounds: CONTIGUOUS_US,
        fitBoundsOptions: { padding: 32 },
        maxBounds: PAN_LIMIT,
        minZoom: 3,
        pitch: 25,
        maxPitch: 75,
        attributionControl: false,
        config: { basemap: { theme: 'faded' } },
      })
    } catch {
      setIsLoading(false)
      setMessage('The map could not start. Check that WebGL is enabled in your browser.')
      onReady()
      return
    }

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right')
    const locate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      fitBoundsOptions: { maxZoom: 15 },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(locate, 'bottom-right')
    const removeLocationIconObserver = installLocationIcon(containerRef.current)
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    locate.on('error', (event: GeolocationPositionError) => {
      setMessage(event.code === 1
        ? 'Location access is blocked. Allow location in your browser settings and try again.'
        : 'Your location is unavailable. Try the location button again.')
    })
    locate.on('outofmaxbounds', () => setMessage('Your location is outside the supported US map area.'))
    locate.on('geolocate', () => setMessage(''))
    map.on('error', () => {
      if (!map.isStyleLoaded()) {
        setIsLoading(false)
        setMessage('The map could not load. Check your connection and Mapbox token, then reload.')
        onReady()
      }
    })

    map.on('load', () => {
      setIsLoading(false)
      setMessage('')
      map.addImage('place-pin', makePinImage(), { pixelRatio: 2 })
      map.addSource('places', {
        type: 'geojson', data: places, cluster: true, clusterMaxZoom: 12, clusterRadius: 50,
      })

      for (const clustered of [true, false]) {
        map.addLayer({
          id: clustered ? 'clusters' : 'unclustered-point',
          type: 'symbol',
          source: 'places',
          filter: clustered ? ['has', 'point_count'] : ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'place-pin',
            'icon-size': clustered ? bySize(1) : 1,
            'icon-anchor': 'bottom',
            'icon-offset': [0, 4], // Compensate for the shadow padding at pixelRatio 2.
            'icon-allow-overlap': true,
            'text-field': clustered ? ['get', 'point_count_abbreviated'] : '1',
            'text-font': ['Arial Unicode MS Bold'],
            'text-size': clustered ? bySize(13) : 13,
            'text-anchor': 'center',
            'text-offset': [0, -2.1],
            'text-allow-overlap': true,
          },
          paint: { 'text-color': '#ffffff' },
        })
      }

      map.on('click', 'clusters', (event) => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const center = feature.geometry.coordinates as [number, number]
        const source = map.getSource('places') as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(Number(feature.properties?.cluster_id), (error, zoom) => {
          if (!error && zoom != null && mapRef.current === map) map.easeTo({ center, zoom })
        })
      })

      map.on('click', 'unclustered-point', (event) => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const coordinates = feature.geometry.coordinates as [number, number]
        popupRef.current?.remove()
        popupRef.current = new mapboxgl.Popup({ offset: [0, -42] })
          .setLngLat(coordinates)
          .setText(String(feature.properties?.name ?? 'Sample location'))
          .addTo(map)
        map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 14), offset: [0, 80] })
      })

      for (const layer of ['clusters', 'unclustered-point']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
      onReady()
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    return () => {
      removeLocationIconObserver()
      resizeObserver.disconnect()
      popupRef.current?.remove()
      popupRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [onReady])

  function searchPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) return
    const place = samplePlaces.find(({ name }) => name.toLowerCase().includes(query.trim().toLowerCase()))
    if (!place) {
      setMessage('No sample city found. Choose a city from the search suggestions.')
      return
    }
    const map = mapRef.current
    if (!map || isLoading) return
    setMessage('')
    popupRef.current?.remove()
    popupRef.current = new mapboxgl.Popup({ offset: [0, -42] })
      .setLngLat(place.coords).setText(place.name).addTo(map)
    map.flyTo({ center: place.coords, zoom: 14, offset: [0, 80] })
  }

  return (
    <main className="price-map" ref={mainRef} tabIndex={-1} aria-label="Explore prices map">
      <h1 className="sr-only">Explore prices</h1>
      <div className="price-map__canvas" ref={containerRef} />
      <header className="price-map__header">
        <a className="wordmark price-map__home" href="./" aria-label="OpenChart home">
          <span>OpenChart<span className="title-period">.</span></span>
        </a>
        <form className="price-map__search" onSubmit={searchPlaces} role="search">
          <input
            type="search" aria-label="Search sample cities" placeholder="Search sample cities…"
            list="sample-cities" value={query} onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setQuery('') }}
          />
          <button type="submit" disabled={isLoading} aria-label="Search cities" title="Search cities">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
          </button>
          <datalist id="sample-cities">
            {samplePlaces.map(({ name }) => <option key={name} value={name} />)}
          </datalist>
        </form>
      </header>
      {message && (
        <div className="price-map__status" role="status">
          {message}
        </div>
      )}
    </main>
  )
}
