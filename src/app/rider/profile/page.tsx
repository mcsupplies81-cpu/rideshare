import AuthGuard from '@/components/shared/AuthGuard'
import { createClient } from '@/lib/supabase/server'

export default async function RiderProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { count: rideCount }, { data: ratings }] = await Promise.all([
    (supabase as any).from('users').select('full_name, phone, created_at').eq('id', user?.id).maybeSingle(),
    (supabase as any).from('rides').select('id', { count: 'exact', head: true }).eq('rider_id', user?.id),
    (supabase as any).from('rides').select('driver_rating').eq('rider_id', user?.id).not('driver_rating', 'is', null),
  ])

  const averageRating = ratings?.length
    ? (ratings.reduce((sum: number, row: any) => sum + Number(row.driver_rating || 0), 0) / ratings.length).toFixed(1)
    : '—'

  return (
    <AuthGuard requiredRole="rider">
      <main className="min-h-screen bg-[#0F0F1A] p-4 pb-24 text-white">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-2xl font-bold">Profile</h1>

          <section className="rounded-xl bg-[#1A1A2E] p-5">
            <h2 className="mb-3 text-lg font-semibold">Edit Profile</h2>
            <p><span className="text-gray-400">Full name:</span> {profile?.full_name ?? '—'}</p>
            <p><span className="text-gray-400">Phone number:</span> {profile?.phone ?? '—'}</p>
            <p><span className="text-gray-400">Member since:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</p>
            <p><span className="text-gray-400">Total rides:</span> {rideCount ?? 0}</p>
            <p><span className="text-gray-400">Average rating:</span> {averageRating}</p>
          </section>

          <section className="rounded-xl bg-[#1A1A2E] p-5">
            <h2 className="mb-2 text-lg font-semibold">Payment Methods</h2>
            <p className="text-gray-300">Add a card</p>
          </section>

          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full rounded-lg border border-[#2A2A44] p-3 text-white">Sign out</button>
          </form>
        </div>
      </main>
    </AuthGuard>
  )
}
