import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import { samplePlaces, type Place } from '../samplePlaces'
import MapSearch from '../MapSearch/MapSearch'
import { filterPlacesByState } from '../placeFilters'
import { getStateBoundaryData } from './stateBoundaries'
import HospitalCard from './HospitalCard'
import 'mapbox-gl/dist/mapbox-gl.css'
import './PriceMap.css'

const CONTIGUOUS_US: mapboxgl.LngLatBoundsLike = [[-125.5, 24], [-66, 49.8]]
const PAN_LIMIT: mapboxgl.LngLatBoundsLike = [[-130, 20], [-60, 53]]
const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})
const placesByName = new Map(samplePlaces.map((place) => [place.name, place]))
function toPlacesData(places: Place[]): FeatureCollection<Point, { name: string; price: number }> {
  return {
    type: 'FeatureCollection',
    features: places.map(({ name, coords, price }) => ({
      type: 'Feature',
      properties: { name, price },
      geometry: { type: 'Point', coordinates: coords },
    })),
  }
}

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
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [hospitalInfo, setHospitalInfo] = useState<{ place: Place; container: HTMLElement } | null>(null)
  const filteredPlaces = useMemo(() => filterPlacesByState(samplePlaces, selectedState), [selectedState])
  const sourceData = useMemo(() => toPlacesData(filteredPlaces), [filteredPlaces])
  const sourceDataRef = useRef(sourceData)
  const stateBoundaryData = useMemo(() => getStateBoundaryData(selectedState), [selectedState])
  const stateBoundaryDataRef = useRef(stateBoundaryData)
  const markersRef = useRef(new Map<string, mapboxgl.Marker>())

  const openHospitalCard = useCallback((place: Place) => {
    const map = mapRef.current
    if (!map) return
    setMessage('')
    popupRef.current?.remove()
    const container = document.createElement('div')
    const popup = new mapboxgl.Popup({
      className: 'hospital-popup', offset: 18, maxWidth: '292px',
      closeButton: false, focusAfterOpen: false,
    }).setLngLat(place.coords).setDOMContent(container).addTo(map)
    popupRef.current = popup
    setHospitalInfo({ place, container })
    popup.on('close', () => {
      if (popupRef.current === popup) {
        popupRef.current = null
        setHospitalInfo(null)
      }
    })
    map.flyTo({ center: place.coords, zoom: Math.max(map.getZoom(), 14), offset: [0, 140] })
  }, [])

  function closeHospitalCard() {
    popupRef.current?.remove()
    mapRef.current?.getCanvas().focus({ preventScroll: true })
  }

  useEffect(() => {
    sourceDataRef.current = sourceData
    stateBoundaryDataRef.current = stateBoundaryData
    const map = mapRef.current
    const source = map?.getSource('places') as mapboxgl.GeoJSONSource | undefined
    if (!map || !source) return

    for (const marker of markersRef.current.values()) marker.remove()
    markersRef.current.clear()
    popupRef.current?.remove()
    popupRef.current = null
    source.setData(sourceData)
    const boundarySource = map.getSource('selected-state') as mapboxgl.GeoJSONSource | undefined
    boundarySource?.setData(stateBoundaryData)
    if (filteredPlaces.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      const boundary = stateBoundaryData.features[0]
      if (boundary) {
        const polygons = boundary.geometry.type === 'Polygon'
          ? [boundary.geometry.coordinates] : boundary.geometry.coordinates
        for (const polygon of polygons) {
          for (const coordinate of polygon[0]) bounds.extend([coordinate[0], coordinate[1]])
        }
      } else {
        for (const place of filteredPlaces) bounds.extend(place.coords)
      }
      map.fitBounds(bounds, {
        padding: { top: 160, bottom: 48, left: 48, right: 48 },
        maxZoom: 8,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600,
      })
    }
  }, [sourceData, filteredPlaces, stateBoundaryData])

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
    const markers = markersRef.current
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
        onReady()
      }
    })

    map.on('load', () => {
      setIsLoading(false)
      setMessage('')
      map.addSource('selected-state', { type: 'geojson', data: stateBoundaryDataRef.current })
      map.addLayer({
        id: 'selected-state-fill', type: 'fill', source: 'selected-state', slot: 'bottom',
        paint: { 'fill-color': '#7050bd', 'fill-opacity': 0.14 },
      })
      map.addLayer({
        id: 'selected-state-edge', type: 'line', source: 'selected-state', slot: 'bottom',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#7050bd', 'line-width': 1.5, 'line-blur': 0.5, 'line-opacity': 0.65 },
      })
      map.addSource('places', {
        type: 'geojson', data: sourceDataRef.current,
        cluster: true, clusterMaxZoom: 12, clusterRadius: 90,
        clusterProperties: {
          minPrice: ['min', ['get', 'price']],
          maxPrice: ['max', ['get', 'price']],
        },
      })
      // Keep the source active while HTML markers display prices and cluster ranges.
      map.addLayer({
        id: 'places-source', type: 'circle', source: 'places',
        paint: { 'circle-radius': 0, 'circle-opacity': 0 },
      })

      function updateMarkers() {
        if (!map.isSourceLoaded('places')) return
        const visible = new Set<string>()
        for (const feature of map.querySourceFeatures('places')) {
          if (feature.geometry.type !== 'Point' || !feature.properties) continue
          const properties = feature.properties
          const clustered = Boolean(properties.cluster)
          const id = clustered ? `cluster-${properties.cluster_id}` : `place-${properties.name}`
          if (visible.has(id)) continue
          visible.add(id)
          if (markers.has(id)) continue

          const coordinates = feature.geometry.coordinates as [number, number]
          const price = formatPrice.format(Number(clustered ? properties.minPrice : properties.price))
          const maxPrice = clustered ? formatPrice.format(Number(properties.maxPrice)) : price
          const element = document.createElement('div')
          element.className = 'price-marker'
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'price-marker__button'
          button.setAttribute('aria-label', clustered
            ? `${properties.point_count} sample locations, estimated prices ${price} to ${maxPrice}. Zoom in`
            : `${properties.name}, estimated price ${price}. View location`)
          button.textContent = clustered ? `${price} – ${maxPrice}` : price
          element.append(button)
          button.addEventListener('click', (event) => {
            event.stopPropagation()
            popupRef.current?.remove()
            if (clustered) {
              const source = map.getSource('places') as mapboxgl.GeoJSONSource
              source.getClusterExpansionZoom(Number(properties.cluster_id), (error, zoom) => {
                if (!error && zoom != null && mapRef.current === map) {
                  map.easeTo({ center: coordinates, zoom })
                }
              })
              return
            }
            const place = placesByName.get(String(properties.name))
            if (place) openHospitalCard(place)
          })
          markers.set(id, new mapboxgl.Marker({ element, anchor: 'center' }).setLngLat(coordinates).addTo(map))
        }
        for (const [id, marker] of markers) {
          if (!visible.has(id)) {
            marker.remove()
            markers.delete(id)
          }
        }
      }
      map.on('render', updateMarkers)
      onReady()
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    return () => {
      removeLocationIconObserver()
      resizeObserver.disconnect()
      for (const marker of markers.values()) marker.remove()
      markers.clear()
      popupRef.current?.remove()
      popupRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [onReady, openHospitalCard])

  function selectPlace(place: Place) {
    const map = mapRef.current
    if (!map || isLoading) return
    openHospitalCard(place)
  }

  return (
    <main className="price-map" ref={mainRef} tabIndex={-1} aria-label="Explore prices map">
      <h1 className="sr-only">Explore prices</h1>
      <div className="price-map__canvas" ref={containerRef} />
      {hospitalInfo && createPortal(
        <HospitalCard key={hospitalInfo.place.name} place={hospitalInfo.place} onClose={closeHospitalCard} />,
        hospitalInfo.container,
      )}
      <header className="price-map__header">
        <a className="wordmark price-map__home" href="./" aria-label="OpenChart home">
          <span>OpenChart<span className="title-period">.</span></span>
        </a>
        <MapSearch places={samplePlaces} disabled={isLoading} onSelect={selectPlace}
          selectedState={selectedState} onStateChange={setSelectedState} />
      </header>
      {message && (
        <div className="price-map__status" role="status">
          {message}
        </div>
      )}
    </main>
  )
}
