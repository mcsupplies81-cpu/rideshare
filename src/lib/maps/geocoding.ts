export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return 'Unknown location'

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${lat},${lng}`)
  url.searchParams.set('key', key)

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return 'Unknown location'

    const data = (await response.json()) as { results?: Array<{ formatted_address?: string }> }
    return data.results?.[0]?.formatted_address ?? 'Unknown location'
  } catch {
    return 'Unknown location'
  }
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance_meters: number; duration_seconds: number } | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return null

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
  url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
  url.searchParams.set('destination', `${destination.lat},${destination.lng}`)
  url.searchParams.set('key', key)

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return null

    const data = (await response.json()) as {
      routes?: Array<{ legs?: Array<{ distance?: { value?: number }; duration?: { value?: number } }> }>
    }
    const leg = data.routes?.[0]?.legs?.[0]
    if (!leg?.distance?.value || !leg.duration?.value) return null

    return { distance_meters: leg.distance.value, duration_seconds: leg.duration.value }
  } catch {
    return null
  }
}
