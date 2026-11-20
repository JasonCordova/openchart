export type Hospital = {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipcode: string
  websiteUrl: string | null
  latitude: number
  longitude: number
  coords: [number, number]
}

function safeWebsiteUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

function parseHospitals(payload: unknown): { hospitals: Hospital[]; unmapped: number } {
  if (!Array.isArray(payload)) throw new Error('The hospital API returned an unexpected response.')
  const hospitals: Hospital[] = []
  let unmapped = 0
  for (const row of payload) {
    if (!row || !Number.isSafeInteger(row.id) || typeof row.name !== 'string') {
      throw new Error('The hospital API returned an invalid record.')
    }
    const { latitude, longitude } = row
    if (typeof latitude !== 'number' || typeof longitude !== 'number'
      || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      unmapped++
      continue
    }
    hospitals.push({
      id: row.id, name: row.name, address: row.address ?? '', city: row.city ?? '',
      state: row.state ?? '', zipcode: row.zipcode ?? '', websiteUrl: safeWebsiteUrl(row.websiteUrl),
      latitude, longitude, coords: [longitude, latitude],
    })
  }
  return { hospitals, unmapped }
}

export async function fetchHospitals(signal: AbortSignal) {
  const response = await fetch('/api/hospitals', { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Hospitals could not be loaded. Check that the backend and MySQL are running.')
  return parseHospitals(await response.json())
}
