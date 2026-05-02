import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getDirections } from '@/lib/maps/geocoding'
import { calculateFare } from '@/lib/fare/calculator'
import type { Database } from '@/types/database'

type PromoCode = {
  code: string
  discount_type: 'percent' | 'flat'
  discount_value: number
}

const fallback = {
  distance_miles: 5.2,
  duration_minutes: 12,
  fares: {
    base: { vehicle_type: 'base', display_name: 'Standard', fare: 6.68, multiplier: 1 },
    smooth: { vehicle_type: 'smooth', display_name: 'Smooth', fare: 8.68, multiplier: 1.3 },
    xl: { vehicle_type: 'xl', display_name: 'XL', fare: 10.02, multiplier: 1.5 },
  },
}

function applyPromo(fare: number, minimumFare: number, promo: PromoCode | null) {
  if (!promo) return { promoCode: null, discountAmount: 0, discountedFare: fare }
  const discountAmount = promo.discount_type === 'percent'
    ? Math.round((fare * (promo.discount_value / 100)) * 100) / 100
    : promo.discount_value
  const discountedFare = Math.max(minimumFare, Math.round((fare - discountAmount) * 100) / 100)
  return {
    promoCode: promo.code,
    discountAmount: Math.max(0, Math.round((fare - discountedFare) * 100) / 100),
    discountedFare,
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const pickup_lat = Number(body.pickup_lat)
  const pickup_lng = Number(body.pickup_lng)
  const dropoff_lat = Number(body.dropoff_lat)
  const dropoff_lng = Number(body.dropoff_lng)
  const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim() : ''

  if ([pickup_lat, pickup_lng, dropoff_lat, dropoff_lng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const supabase = await createServiceClient() as any
  let promo: PromoCode | null = null
  if (promoCode) {
    const now = new Date().toISOString()
    const { data } = await (supabase as any)
      .from('promo_codes')
      .select('code, discount_type, discount_value')
      .eq('code', promoCode)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .or('max_uses.is.null,and(max_uses.not.is.null,uses.lt.max_uses)')
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ error: 'Promo code invalid or expired' }, { status: 400 })
    }
    promo = { ...data, discount_value: Number(data.discount_value) }
  }

  let distance_miles = fallback.distance_miles
  let duration_minutes = fallback.duration_minutes

  if (process.env.GOOGLE_MAPS_SERVER_KEY) {
    const directions = await getDirections({ lat: pickup_lat, lng: pickup_lng }, { lat: dropoff_lat, lng: dropoff_lng })
    if (directions) {
      distance_miles = directions.distance_meters / 1609.344
      duration_minutes = Math.round(directions.duration_seconds / 60)
    }
  }

  const { data: settings } = await supabase.from('fare_settings').select('*').order('created_at', { ascending: false }).limit(1).single()
  const { data: pricing }: { data: any[] | null } = await supabase.from('vehicle_pricing').select('*')

  const defaultSettings: Database['public']['Tables']['fare_settings']['Row'] = settings ?? {
    id: 'fallback', region_id: null, base_fare: 2, per_mile_rate: 0.9, per_minute_rate: 0, minimum_fare: 5, effective_from: new Date().toISOString(), created_by: null, created_at: new Date().toISOString(),
  }

  const pricingByType = new Map((pricing ?? []).map((row) => [row.vehicle_type, row]))

  const buildFare = (vehicle_type: 'base' | 'smooth' | 'xl', display_name: string, multiplier: number) => {
    const row = pricingByType.get(vehicle_type)
    const m = row?.multiplier ?? multiplier
    const name = row?.display_name ?? display_name
    const surgeMultiplier = Number(settings?.surge_multiplier ?? 1)
    const { fare, breakdown } = calculateFare({ base_fare: defaultSettings.base_fare, per_mile_rate: defaultSettings.per_mile_rate, distance_miles, multiplier: m, surgeMultiplier, minimum_fare: defaultSettings.minimum_fare })
    const promoResult = applyPromo(fare, defaultSettings.minimum_fare, promo)
    return { vehicle_type, display_name: name, fare, multiplier: m, ...promoResult, breakdown }
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
