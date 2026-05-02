import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type RatedBy = 'rider' | 'driver'

export async function POST(request: Request, { params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const { rating, rated_by } = (await request.json()) as { rating: number; rated_by: RatedBy }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ride } = await serviceSupabase.from('rides').select('id,rider_id,driver_id').eq('id', rideId).single()
  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  if (ride.rider_id !== userId && ride.driver_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (rated_by === 'rider') {
    await serviceSupabase.from('rides').update({ rating_by_rider: rating }).eq('id', rideId)
    const { data: ratings } = await serviceSupabase
      .from('rides')
      .select('rating_by_rider')
      .eq('driver_id', ride.driver_id!)
      .not('rating_by_rider', 'is', null)
    const avg = ratings && ratings.length ? (ratings as any[]).reduce((s: number, r: any) => s + (r.rating_by_rider ?? 0), 0) / ratings.length : 0
    await serviceSupabase.from('drivers').update({ rating: Math.round(avg * 100) / 100 }).eq('id', ride.driver_id!)
  }

  if (rated_by === 'driver') {
    await serviceSupabase.from('rides').update({ rating_by_driver: rating }).eq('id', rideId)
    const { data: ratings } = await serviceSupabase
      .from('rides')
      .select('rating_by_driver')
      .eq('rider_id', ride.rider_id)
      .not('rating_by_driver', 'is', null)
    const avg = ratings && ratings.length ? (ratings as any[]).reduce((s: number, r: any) => s + (r.rating_by_driver ?? 0), 0) / ratings.length : 0
    await serviceSupabase.from('riders').update({ rating: Math.round(avg * 100) / 100 }).eq('id', ride.rider_id)
  }

  await serviceSupabase.from('ride_events').insert({
    ride_id: rideId,
    event_type: 'rating_submitted',
    actor_id: userId,
    metadata: { rating, rated_by },
  })

  return NextResponse.json({ success: true })
}
