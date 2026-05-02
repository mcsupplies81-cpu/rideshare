import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { calculateFare } from '@/lib/fare/calculator'
import { getDirections } from '@/lib/maps/geocoding'

const fallback = {
  distance_miles: 5.2,
  duration_minutes: 12,
  fares: {
    base: { vehicle_type: 'base', display_name: 'Standard', fare: 6.68, multiplier: 1 },
    smooth: { vehicle_type: 'smooth', display_name: 'Smooth', fare: 8.68, multiplier: 1.3 },
    xl: { vehicle_type: 'xl', display_name: 'XL', fare: 10.02, multiplier: 1.5 },
  },
}

export async function GET(request: NextRequest) {
  const lat1 = Number(request.nextUrl.searchParams.get('pickup_lat'))
  const lng1 = Number(request.nextUrl.searchParams.get('pickup_lng'))
  const lat2 = Number(request.nextUrl.searchParams.get('dropoff_lat'))
  const lng2 = Number(request.nextUrl.searchParams.get('dropoff_lng'))
  if ([lat1, lng1, lat2, lng2].some((n) => Number.isNaN(n))) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })

  if (!process.env.GOOGLE_MAPS_SERVER_KEY) return NextResponse.json(fallback)

  const directions = await getDirections({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 })
  if (!directions) return NextResponse.json(fallback)

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: fareSettings } = await supabase.from('fare_settings').select('*').order('created_at', { ascending: false }).limit(1).single()
  const { data: vehiclePricing } = await supabase.from('vehicle_pricing').select('*')

  const distance_miles = directions.distance_meters / 1609.344
  const duration_minutes = Math.round(directions.duration_seconds / 60)

  const defaults = { base_fare: 2, per_mile_rate: 0.9, minimum_fare: 5 }
  const fareConfig = fareSettings ?? { ...defaults }

  const rows = vehiclePricing ?? [
    { vehicle_type: 'base', display_name: 'Standard', multiplier: 1 },
    { vehicle_type: 'smooth', display_name: 'Smooth', multiplier: 1.3 },
    { vehicle_type: 'xl', display_name: 'XL', multiplier: 1.5 },
  ]

  const fares = Object.fromEntries(rows.map((row) => [row.vehicle_type, { vehicle_type: row.vehicle_type, display_name: row.display_name, multiplier: row.multiplier, fare: calculateFare({ base_fare: fareConfig.base_fare, per_mile_rate: fareConfig.per_mile_rate, distance_miles, multiplier: row.multiplier, minimum_fare: fareConfig.minimum_fare }).fare }]))

  return NextResponse.json({ distance_miles, duration_minutes, fares })
}
