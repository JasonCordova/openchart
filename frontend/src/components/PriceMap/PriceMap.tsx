import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import { fetchHospitals, type Hospital as Place } from '../../api/hospitals'
import MapSearch from '../MapSearch/MapSearch'
import { filterPlacesByState } from '../placeFilters'
import { getStateBoundaryData } from './stateBoundaries'
import HospitalCard from './HospitalCard'
import 'mapbox-gl/dist/mapbox-gl.css'
import './PriceMap.css'

const CONTIGUOUS_US: mapboxgl.LngLatBoundsLike = [[-125.5, 24], [-66, 49.8]]
function toPlacesData(places: Place[]): FeatureCollection<Point, { id: number; name: string }> {
  return {
    type: 'FeatureCollection',
    features: places.map(({ id, name, coords }) => ({
      type: 'Feature',
      properties: { id, name },
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
  const markersRef = useRef(new Map<string, mapboxgl.Marker>())
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [unmapped, setUnmapped] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const placesByIdRef = useRef(new Map<number, Place>())
  const [hospitalInfo, setHospitalInfo] = useState<{ place: Place; container: HTMLElement } | null>(null)
  const filteredPlaces = useMemo(() => filterPlacesByState(places, selectedState), [places, selectedState])
  const sourceData = useMemo(() => toPlacesData(filteredPlaces), [filteredPlaces])
  const sourceDataRef = useRef(sourceData)
  const stateBoundaryData = useMemo(() => getStateBoundaryData(selectedState), [selectedState])
  const stateBoundaryDataRef = useRef(stateBoundaryData)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    let active = true
    setDataLoading(true)
    setDataError('')
    fetchHospitals(controller.signal).then(({ hospitals, unmapped }) => {
      if (!active) return
      placesByIdRef.current = new Map(hospitals.map((hospital) => [hospital.id, hospital]))
      setPlaces(hospitals)
      setUnmapped(unmapped)
    }).catch(() => {
      if (active) setDataError('Hospitals could not be loaded. Check that the backend and MySQL are running, then retry.')
    }).finally(() => {
      window.clearTimeout(timeout)
      if (active) setDataLoading(false)
    })
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [refresh])

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
    map.flyTo({ center: place.coords, zoom: Math.max(map.getZoom(), 15), offset: [0, 140] })
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
    if (filteredPlaces.length > 0 && selectedState) {
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
    } else if (!selectedState) {
      map.fitBounds(CONTIGUOUS_US, { padding: 32, duration: 600 })
    }
  }, [sourceData, filteredPlaces, stateBoundaryData, selectedState])

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
        minZoom: 1,
        pitch: 0,
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
    let markerFrame = 0
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
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      })
      // Keep clustering in Mapbox; count markers sit above the canvas and map lines.
      map.addLayer({
        id: 'places-source', type: 'circle', source: 'places',
        paint: { 'circle-radius': 0, 'circle-opacity': 0 },
      })
      function updateMarkers() {
        if (!map.isSourceLoaded('places')) return
        const visible = new Set<string>()
        const { width, height } = map.getCanvas().getBoundingClientRect()
        for (const feature of map.querySourceFeatures('places')) {
          if (feature.geometry.type !== 'Point' || !feature.properties) continue
          const coordinates = feature.geometry.coordinates as [number, number]
          const point = map.project(coordinates)
          if (point.x < -30 || point.x > width + 30 || point.y < 0 || point.y > height + 45) continue
          const properties = feature.properties
          const clustered = Boolean(properties.cluster)
          const id = clustered ? `cluster-${properties.cluster_id}` : `hospital-${properties.id}`
          if (visible.has(id)) continue
          visible.add(id)
          if (markers.has(id)) continue

          const element = document.createElement('div')
          element.className = 'price-marker'
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'price-marker__button'
          const count = clustered ? Number(properties.point_count) : 1
          element.dataset.clusterSize = String(count)
          if (clustered) element.dataset.clusterId = String(properties.cluster_id)
          else element.dataset.hospitalId = String(properties.id)
          element.title = clustered ? `${count} hospitals. Zoom in` : String(properties.name)
          button.setAttribute('aria-label', element.title)
          button.textContent = String(count)
          element.append(button)
          const marker = new mapboxgl.Marker({ element, anchor: 'center' }).setLngLat(coordinates)
          const select = () => {
            popupRef.current?.remove()
            if (clustered) {
              const source = map.getSource('places') as mapboxgl.GeoJSONSource
              const data = sourceDataRef.current
              source.getClusterExpansionZoom(Number(properties.cluster_id), (error, zoom) => {
                if (!error && zoom != null && mapRef.current === map && sourceDataRef.current === data) {
                  map.easeTo({ center: coordinates, zoom })
                }
              })
            } else {
              const place = placesByIdRef.current.get(Number(properties.id))
              if (place) openHospitalCard(place)
            }
          }
          button.addEventListener('click', (event) => { event.stopPropagation(); select() })
          markers.set(id, marker.addTo(map))
        }
        for (const [id, marker] of markers) {
          if (!visible.has(id)) { marker.remove(); markers.delete(id) }
        }
      }
      const scheduleMarkers = () => {
        if (markerFrame) return
        markerFrame = requestAnimationFrame(() => { markerFrame = 0; if (mapRef.current === map) updateMarkers() })
      }
      map.on('moveend', scheduleMarkers)
      map.on('resize', scheduleMarkers)
      map.on('sourcedata', (event) => {
        if (event.sourceId === 'places') scheduleMarkers()
      })
      scheduleMarkers()
      onReady()
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    return () => {
      removeLocationIconObserver()
      resizeObserver.disconnect()
      cancelAnimationFrame(markerFrame)
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
    <main className="price-map" ref={mainRef} tabIndex={-1} aria-label="Explore hospitals map">
      <h1 className="sr-only">Explore hospitals</h1>
      <div className="price-map__canvas" ref={containerRef} />
      {hospitalInfo && createPortal(
        <HospitalCard key={hospitalInfo.place.id} place={hospitalInfo.place} onClose={closeHospitalCard} />,
        hospitalInfo.container,
      )}
      <header className="price-map__header">
        <a className="wordmark price-map__home" href="./" aria-label="OpenChart home">
          <span>OpenChart<span className="title-period">.</span></span>
        </a>
        <MapSearch places={places} disabled={isLoading || dataLoading || Boolean(dataError)} onSelect={selectPlace}
          selectedState={selectedState} onStateChange={setSelectedState} />
      </header>
      {(message || dataError || dataLoading || places.length === 0) && (
        <div className="price-map__status" role="status">
          {message || dataError || (dataLoading ? 'Loading hospitals…' : 'No hospitals with valid coordinates are available.')}
          {dataError && <button type="button" onClick={() => setRefresh((value) => value + 1)}>Retry</button>}
        </div>
      )}
      {!dataLoading && !dataError && places.length > 0 && (
        <div className="price-map__directory" role="status">
          {filteredPlaces.length.toLocaleString()} hospitals
          {unmapped > 0 && <span> · {unmapped} without map coordinates</span>}
          <button type="button" onClick={() => setRefresh((value) => value + 1)} aria-label="Refresh hospitals">Refresh</button>
        </div>
      )}
    </main>
  )
}
