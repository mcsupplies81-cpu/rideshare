let googleMapsPromise: Promise<void> | null = null

const SCRIPT_ID = 'google-maps-js'

declare global {
  interface Window {
    google: typeof google
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'))
  }

  if (window.google?.maps) {
    return Promise.resolve()
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.'))
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'))

    document.head.appendChild(script)
  })

  return googleMapsPromise
}

export async function getGoogleMaps(): Promise<typeof google.maps> {
  await loadGoogleMaps()
  return window.google.maps
}
