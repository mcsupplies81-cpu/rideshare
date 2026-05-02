import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const supabase = await createClient() as any
  const { data } = await supabase.from('rides').select('*, users!rides_rider_id_fkey(full_name)').eq('id', rideId).single()
  return NextResponse.json({ ...data, rider_name: data?.users?.full_name })
}
