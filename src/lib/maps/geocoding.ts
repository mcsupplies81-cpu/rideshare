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

    const data = await response.json()
    const leg = data?.routes?.[0]?.legs?.[0]
    if (!leg?.distance?.value || !leg?.duration?.value) return null

    return {
      distance_meters: Number(leg.distance.value),
      duration_seconds: Number(leg.duration.value),
    }
  } catch {
    return null
  }
}
