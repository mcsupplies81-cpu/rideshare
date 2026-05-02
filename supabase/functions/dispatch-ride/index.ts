import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 3

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { ride_id } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch ride details
    const { data: ride } = await supabase
      .from('rides')
      .select('*')
      .eq('id', ride_id)
      .single()

    if (!ride) {
      return new Response(JSON.stringify({ error: 'Ride not found' }), {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Update status to searching
    await supabase
      .from('rides')
      .update({ status: 'searching' })
      .eq('id', ride_id)
      .eq('status', 'payment_authorized')

    // Try to match a driver, with retries
    let driverId: string | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !driverId; attempt++) {
      const matchRes = await fetch(`${supabaseUrl}/functions/v1/match-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          pickup_lat: ride.pickup_lat,
          pickup_lng: ride.pickup_lng,
          vehicle_type: ride.vehicle_type,
        }),
      })
      const { driver } = await matchRes.json()
      if (driver) {
        driverId = driver
      } else if (attempt < MAX_ATTEMPTS - 1) {
        // Wait before retry
        await new Promise((r) => setTimeout(r, 5000))

        // Check if rider already cancelled
        const { data: current } = await supabase
          .from('rides')
          .select('status')
          .eq('id', ride_id)
          .single()
        if (current?.status !== 'searching') break
      }
    }

    if (!driverId) {
      await supabase
        .from('rides')
        .update({ status: 'no_driver_found' })
        .eq('id', ride_id)

      await supabase.from('ride_events').insert({
        ride_id,
        event_type: 'no_driver_found',
      })

      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Notify the driver
    await fetch(`${supabaseUrl}/functions/v1/notify-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ ride_id, driver_id: driverId }),
    })

    return new Response(JSON.stringify({ matched: true, driver_id: driverId }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
