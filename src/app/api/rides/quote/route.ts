import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getDirections } from '@/lib/maps/geocoding'
import { calculateFare } from '@/lib/fare/calculator'
import type { Database } from '@/types/database'

const fallback = {
  distance_miles: 5.2,
  duration_minutes: 12,
  fares: {
    base: { vehicle_type: 'base', display_name: 'Standard', fare: 6.68, multiplier: 1 },
    smooth: { vehicle_type: 'smooth', display_name: 'Smooth', fare: 8.68, multiplier: 1.3 },
    xl: { vehicle_type: 'xl', display_name: 'XL', fare: 10.02, multiplier: 1.5 },
  },
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pickup_lat = Number(url.searchParams.get('pickup_lat'))
  const pickup_lng = Number(url.searchParams.get('pickup_lng'))
  const dropoff_lat = Number(url.searchParams.get('dropoff_lat'))
  const dropoff_lng = Number(url.searchParams.get('dropoff_lng'))

  if ([pickup_lat, pickup_lng, dropoff_lat, dropoff_lng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
    return NextResponse.json(fallback)
  }

  const directions = await getDirections({ lat: pickup_lat, lng: pickup_lng }, { lat: dropoff_lat, lng: dropoff_lng })
  if (!directions) return NextResponse.json(fallback)

  const distance_miles = directions.distance_meters / 1609.344
  const duration_minutes = Math.round(directions.duration_seconds / 60)

  const supabase = await createServiceClient()
  const { data: settings } = await supabase.from('fare_settings').select('*').order('created_at', { ascending: false }).limit(1).single()
  const { data: pricing } : { data: any[] | null } = await supabase.from('vehicle_pricing').select('*')

  const defaultSettings: Database['public']['Tables']['fare_settings']['Row'] = settings ?? {
    id: 'fallback', region_id: null, base_fare: 2, per_mile_rate: 0.9, per_minute_rate: 0, minimum_fare: 5, effective_from: new Date().toISOString(), created_by: null, created_at: new Date().toISOString(),
  }

  const pricingByType = new Map((pricing ?? []).map((row) => [row.vehicle_type, row]))

  const buildFare = (vehicle_type: 'base' | 'smooth' | 'xl', display_name: string, multiplier: number) => {
    const row = pricingByType.get(vehicle_type)
    const m = row?.multiplier ?? multiplier
    const name = row?.display_name ?? display_name
    const { fare } = calculateFare({ base_fare: defaultSettings.base_fare, per_mile_rate: defaultSettings.per_mile_rate, distance_miles, multiplier: m, minimum_fare: defaultSettings.minimum_fare })
    return { vehicle_type, display_name: name, fare, multiplier: m }
  }

  return NextResponse.json({
    distance_miles,
    duration_minutes,
    fares: {
      base: buildFare('base', 'Standard', 1),
      smooth: buildFare('smooth', 'Smooth', 1.3),
      xl: buildFare('xl', 'XL', 1.5),
    },
  })
}
