import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = await req.json()

    const mapsKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY')
    let miles = 5.0
    let minutes = 15

    if (mapsKey) {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin_lat},${origin_lng}&destination=${dest_lat},${dest_lng}&key=${mapsKey}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.routes?.[0]?.legs?.[0]) {
        const leg = data.routes[0].legs[0]
        miles = leg.distance.value / 1609.34
        minutes = Math.ceil(leg.duration.value / 60)
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: fareSettings } = await supabase
      .from('fare_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: vehiclePricing } = await supabase
      .from('vehicle_pricing')
      .select('*')

    const baseFare = fareSettings?.base_fare ?? 2.00
    const perMile = fareSettings?.per_mile_rate ?? 0.90
    const minimum = fareSettings?.minimum_fare ?? 5.00

    const multipliers: Record<string, number> = {}
    for (const row of vehiclePricing ?? []) {
      multipliers[row.vehicle_type] = row.multiplier
    }

    function calcFare(vehicleType: string) {
      const m = multipliers[vehicleType] ?? 1.0
      return Math.max(minimum, (baseFare + perMile * miles) * m)
    }

    return new Response(JSON.stringify({
      miles: Math.round(miles * 100) / 100,
      minutes,
      fares: {
        base: Math.round(calcFare('base') * 100) / 100,
        smooth: Math.round(calcFare('smooth') * 100) / 100,
        xl: Math.round(calcFare('xl') * 100) / 100,
      },
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
