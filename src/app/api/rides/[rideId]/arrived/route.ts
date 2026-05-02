import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: Request, { params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: ride } = await supabase.from('rides').select('status,driver_id').eq('id', rideId).single()
  if (ride?.status !== 'accepted' || ride.driver_id !== user.id) return NextResponse.json({ error: 'invalid_state' }, { status: 409 })
  await supabase.from('rides').update({ status: 'driver_arrived', driver_arrived_at: new Date().toISOString() }).eq('id', rideId)
  await supabase.from('ride_events').insert({ ride_id: rideId, event_type: 'driver_arrived', actor_id: user.id })
  return NextResponse.json({ success: true })
}
