import Link from 'next/link'
import AuthGuard from '@/components/shared/AuthGuard'
import { createClient } from '@/lib/supabase/server'

const truncate = (value: string | null) => (value ? (value.length > 30 ? `${value.slice(0, 30)}...` : value) : '—')

export default async function RiderHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <AuthGuard requiredRole="rider"><main /></AuthGuard>
  }

  const { data: rides } = await (supabase as any)
    .from('rides')
    .select('id, pickup_address, dropoff_address, final_fare, rider_rating, completed_at, vehicle_type')
    .eq('rider_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20)

  return (
    <AuthGuard requiredRole="rider">
      <main className="min-h-screen bg-[#0F0F1A] p-4 pb-24 text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold">Ride history</h1>
          {!rides?.length ? (
            <div className="rounded-xl bg-[#1A1A2E] p-8 text-center">
              <p className="mb-4 text-gray-300">No rides yet. Book your first ride!</p>
              <Link href="/rider" className="rounded-lg bg-[#7B5EA7] px-4 py-2 font-semibold">Book your first ride</Link>
            </div>
          ) : (
            rides.map((ride: any) => (
              <article key={ride.id} className="rounded-xl border border-[#2A2A44] bg-[#1A1A2E] p-4">
                <p className="text-sm text-gray-300">{ride.completed_at ? new Date(ride.completed_at).toLocaleString() : '—'}</p>
                <p className="mt-1">{truncate(ride.pickup_address)} → {truncate(ride.dropoff_address)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-[#7B5EA7]">${Number(ride.final_fare ?? 0).toFixed(2)}</span>
                  <span>{ride.rider_rating ? `★ ${ride.rider_rating}` : 'Not rated'}</span>
                  <span className="rounded-full bg-[#2A2A44] px-2 py-1 text-xs uppercase">{ride.vehicle_type ?? 'standard'}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
