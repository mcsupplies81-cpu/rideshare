import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACCEPT_TIMEOUT_MS = 30_000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { ride_id, driver_id } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch ride for the broadcast payload
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

    // Broadcast ride request to the driver's personal channel
    await supabase.channel(`driver:${driver_id}`).send({
      type: 'broadcast',
      event: 'message',
      payload: { type: 'ride_request', ride },
    })

    // Poll for acceptance for up to 30 seconds
    const deadline = Date.now() + ACCEPT_TIMEOUT_MS
    let accepted = false

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000))

      const { data: current } = await supabase
        .from('rides')
        .select('status, driver_id')
        .eq('id', ride_id)
        .single()

      if (!current || current.status !== 'searching') {
        // Ride was cancelled or already accepted
        accepted = current?.status === 'accepted'
        break
      }

      if (current.driver_id === driver_id && current.status === 'accepted') {
        accepted = true
        break
      }
    }

    if (!accepted) {
      // Driver didn't respond — send decline notification and let dispatch-ride retry
      await supabase.channel(`driver:${driver_id}`).send({
        type: 'broadcast',
        event: 'message',
        payload: { type: 'ride_expired', ride_id },
      })
    }

    return new Response(JSON.stringify({ accepted }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
