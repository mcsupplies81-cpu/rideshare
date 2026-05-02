import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let loaderPromise: Promise<typeof google> | null = null

export function loadGoogleMaps(): Promise<typeof google> {
  if (loaderPromise) return loaderPromise
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is missing'))
  setOptions({ key: apiKey, v: 'weekly' })
  loaderPromise = Promise.all([importLibrary('maps'), importLibrary('places'), importLibrary('geometry')]).then(() => google)
  return loaderPromise
}
