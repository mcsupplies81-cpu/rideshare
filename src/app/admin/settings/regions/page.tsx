import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export default async function RegionsPage() {
  const supabase = (await createServiceClient()) as any
  const { data: regions } = await supabase
    .from('regions')
    .select('id,name,is_active,created_at,city,state,center_lat,center_lng,radius_miles')
    .order('created_at', { ascending: false })

  async function toggleRegion(formData: FormData) {
    'use server'
    const s = (await createServiceClient()) as any
    await s.from('regions').update({ is_active: formData.get('is_active') === 'true' }).eq('id', formData.get('id'))
    revalidatePath('/admin/settings/regions')
  }

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Regions</h1>

      <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="p-3">Name</th><th>Location</th><th>Radius</th><th>Created</th><th>Active</th>
            </tr>
          </thead>
          <tbody>
            {(regions ?? []).map((region: any) => (
              <tr key={region.id} className="border-t border-slate-800">
                <td className="p-3">{region.name}</td>
                <td>{region.city}, {region.state}</td>
                <td>{region.radius_miles} mi</td>
                <td>{new Date(region.created_at).toLocaleString()}</td>
                <td>
                  <form action={toggleRegion}>
                    <input type="hidden" name="id" value={region.id} />
                    <input type="hidden" name="is_active" value={String(!region.is_active)} />
                    <button className={`rounded px-3 py-1 text-xs ${region.is_active ? 'bg-emerald-700' : 'bg-slate-700'}`}>
                      {region.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action="/api/admin/regions" method="post" className="grid gap-2 rounded-xl bg-[#1A1A2E] p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Add Region</h2>
        <input name="name" placeholder="Region name" required className="rounded bg-slate-900 p-2" />
        <input name="city" placeholder="City" required className="rounded bg-slate-900 p-2" />
        <input name="state" placeholder="State" required className="rounded bg-slate-900 p-2" />
        <input name="center_lat" type="number" step="0.000001" placeholder="Center latitude" required className="rounded bg-slate-900 p-2" />
        <input name="center_lng" type="number" step="0.000001" placeholder="Center longitude" required className="rounded bg-slate-900 p-2" />
        <input name="radius_miles" type="number" step="0.1" placeholder="Radius (miles)" required className="rounded bg-slate-900 p-2" />
        <button className="md:col-span-2 rounded bg-purple-600 px-4 py-2">Create Region</button>
      </form>
    </div>
  )
}
