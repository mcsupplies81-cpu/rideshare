import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export default async function RegionsSettingsPage() {
  const supabase = (await createServiceClient()) as any
  const { data: regions } = await supabase.from('regions').select('id,name,city,state,bounds,is_active,created_at').order('created_at', { ascending: false })

  async function toggleRegion(formData: FormData) {
    'use server'
    const s = (await createServiceClient()) as any
    await s.from('regions').update({ is_active: formData.get('is_active') === 'true' }).eq('id', formData.get('id'))
    revalidatePath('/admin/settings/regions')
  }

  async function addRegion(formData: FormData) {
    'use server'
    const payload = {
      name: formData.get('name'), city: formData.get('city'), state: formData.get('state'), center_lat: Number(formData.get('center_lat')), center_lng: Number(formData.get('center_lng')), radius_miles: Number(formData.get('radius_miles')),
    }
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/regions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    revalidatePath('/admin/settings/regions')
  }

  return <div className="space-y-6 text-white"><h1 className="text-2xl font-bold">Regions</h1>
    <div className="rounded-xl bg-[#1A1A2E] p-4">
      <h2 className="mb-3 font-semibold">All Regions</h2>
      <table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th>Name</th><th>Location</th><th>Created</th><th>Active</th></tr></thead><tbody>{(regions ?? []).map((region: any) => <tr key={region.id} className="border-t border-slate-800"><td className="py-2">{region.name}</td><td>{region.city}, {region.state}</td><td>{new Date(region.created_at).toLocaleString()}</td><td><form action={toggleRegion} className="inline"><input type="hidden" name="id" value={region.id} /><input type="hidden" name="is_active" value={region.is_active ? 'false' : 'true'} /><button className={`rounded px-3 py-1 ${region.is_active ? 'bg-emerald-700' : 'bg-slate-700'}`}>{region.is_active ? 'Active' : 'Inactive'}</button></form></td></tr>)}</tbody></table>
    </div>

    <form action={addRegion} className="space-y-2 rounded-xl bg-[#1A1A2E] p-4">
      <h2 className="font-semibold">Add Region</h2>
      <input name="name" placeholder="Region name" required className="w-full rounded bg-slate-900 p-2" />
      <div className="grid gap-2 md:grid-cols-2"><input name="city" placeholder="City" required className="rounded bg-slate-900 p-2" /><input name="state" placeholder="State" required className="rounded bg-slate-900 p-2" /></div>
      <div className="grid gap-2 md:grid-cols-3"><input name="center_lat" type="number" step="0.000001" placeholder="Center Latitude" required className="rounded bg-slate-900 p-2" /><input name="center_lng" type="number" step="0.000001" placeholder="Center Longitude" required className="rounded bg-slate-900 p-2" /><input name="radius_miles" type="number" step="0.1" placeholder="Radius (miles)" required className="rounded bg-slate-900 p-2" /></div>
      <button className="rounded bg-purple-600 px-4 py-2">Create Region</button>
    </form>
  </div>
}
