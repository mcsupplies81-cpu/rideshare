import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { pickup_lat, pickup_lng, vehicle_type } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Haversine query: find online, approved drivers within 10 miles matching vehicle type
    // Uses the driver_locations table and joins drivers + vehicles
    const { data: drivers, error } = await supabase.rpc('find_nearest_driver', {
      p_lat: pickup_lat,
      p_lng: pickup_lng,
      p_vehicle_type: vehicle_type,
      p_radius_miles: 10,
    })

    if (error) {
      // Fallback: simple join without spatial distance
      const { data: fallbackDrivers } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          lat,
          lng,
          drivers!inner(
            id,
            is_online,
            approval_status,
            vehicles(vehicle_type)
          )
        `)
        .eq('drivers.is_online', true)
        .eq('drivers.approval_status', 'approved')
        .limit(5)

      const filtered = (fallbackDrivers ?? []).filter((d: any) =>
        d.drivers?.vehicles?.some((v: any) => v.vehicle_type === vehicle_type || vehicle_type === 'base')
      )

      return new Response(JSON.stringify({ driver: filtered[0]?.driver_id ?? null }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ driver: drivers?.[0]?.driver_id ?? null }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
