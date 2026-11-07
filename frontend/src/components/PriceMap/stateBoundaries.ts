import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { stateNames } from '../placeFilters'
import usStates from './usStates.json'

type StateBoundaries = FeatureCollection<Polygon | MultiPolygon, { STATE_NAME: string; STATE_ID: string }>

// Boundary data from Mapbox's public US states example; see frontend/README.md.
const boundaries = usStates as unknown as StateBoundaries

export function getStateBoundaryData(state: string): StateBoundaries {
  const boundary = state ? boundaries.features.find((feature) => feature.properties.STATE_NAME === stateNames[state]) : undefined
  return { type: 'FeatureCollection', features: boundary ? [boundary] : [] }
}
