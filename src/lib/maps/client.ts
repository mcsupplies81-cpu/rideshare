import { Loader } from '@googlemaps/js-api-loader'

let mapsPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    mapsPromise = Promise.resolve()
    return mapsPromise
  }

  const loader = new Loader({ apiKey: key, version: 'weekly', libraries: ['places', 'geometry'] })
  mapsPromise = (loader as any).load().then(() => undefined)
  return mapsPromise
}
