import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function FaresPage({ searchParams }: { searchParams: Promise<{ region_id?: string }> }) {
  const params = await searchParams
  const s = await createServiceClient() as any
  const [{ data: pricing }, { data: regions }] = await Promise.all([
    s.from('vehicle_pricing').select('*').order('vehicle_type'),
    s.from('regions').select('*').eq('is_active', true).order('name'),
  ])

  const selectedRegionId = params.region_id && regions?.some((r: any) => r.id === params.region_id) ? params.region_id : regions?.[0]?.id ?? null
  const [{ data: current }, { data: history }] = await Promise.all([
    s.from('fare_settings').select('*').eq('region_id', selectedRegionId).order('effective_from', { ascending: false }).limit(1).maybeSingle(),
    s.from('fare_settings').select('*').eq('region_id', selectedRegionId).order('effective_from', { ascending: false }).limit(5),
  ])

  async function updateBase(formData: FormData) { 'use server'; const s = await createServiceClient() as any; await s.from('fare_settings').insert({ region_id: formData.get('region_id'), base_fare: Number(formData.get('base_fare')), per_mile_rate: Number(formData.get('per_mile_rate')), minimum_fare: Number(formData.get('minimum_fare')), per_minute_rate: 0, effective_from: new Date().toISOString() }); revalidatePath('/admin/settings/fares') }
  async function updateMultiplier(formData: FormData) { 'use server'; const s = await createServiceClient() as any; await s.from('vehicle_pricing').update({ multiplier: Number(formData.get('multiplier')) }).eq('vehicle_type', formData.get('vehicle_type')); revalidatePath('/admin/settings/fares') }
  async function updateSurge(formData: FormData) { 'use server'; await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/surge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ region_id: formData.get('region_id'), multiplier: Number(formData.get('multiplier')) }) }); revalidatePath('/admin/settings/fares') }

  return <div className="space-y-6 text-white"><h1 className="text-2xl font-bold">Fare Settings</h1>
  {regions && regions.length > 1 && <div className='flex gap-2'>{regions.map((r: any) => <Link key={r.id} href={`/admin/settings/fares?region_id=${r.id}`} className={`rounded-full px-3 py-1 text-sm ${selectedRegionId===r.id?'bg-purple-600':'bg-slate-700'}`}>{r.name}</Link>)}</div>}
  <div className="rounded-xl bg-[#1A1A2E] p-4"><p>Base fare: ${Number(current?.base_fare ?? 0).toFixed(2)}</p><p>Per mile rate: ${Number(current?.per_mile_rate ?? 0).toFixed(2)}</p><p>Minimum fare: ${Number(current?.minimum_fare ?? 0).toFixed(2)}</p></div>
  <form action={updateBase} className="space-y-2 rounded-xl bg-[#1A1A2E] p-4"><h2 className="font-semibold">Update Base Fares</h2><input type='hidden' name='region_id' value={selectedRegionId ?? ''} /><input name="base_fare" type="number" step="0.01" defaultValue={current?.base_fare ?? 0} className="w-full rounded bg-slate-900 p-2" /><input name="per_mile_rate" type="number" step="0.01" defaultValue={current?.per_mile_rate ?? 0} className="w-full rounded bg-slate-900 p-2" /><input name="minimum_fare" type="number" step="0.01" defaultValue={current?.minimum_fare ?? 0} className="w-full rounded bg-slate-900 p-2" /><button className="rounded bg-purple-600 px-4 py-2">Save</button></form>
  <div className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-2 font-semibold">Update Multipliers</h2>{pricing?.map((v:any)=><form key={v.vehicle_type} action={updateMultiplier} className="mb-2 flex items-center gap-2"><input type="hidden" name="vehicle_type" value={v.vehicle_type} /><label className="w-24 capitalize">{v.vehicle_type}</label><input name="multiplier" type="number" step="0.01" defaultValue={v.multiplier} className="rounded bg-slate-900 p-2"/><button className="rounded bg-slate-800 px-3 py-2">Update</button></form>)}</div>
  <div className='rounded-xl bg-[#1A1A2E] p-4'><h2 className='mb-2 font-semibold'>Surge Multipliers</h2>{regions?.map((r: any) => <form key={r.id} action={updateSurge} className='mb-2 flex items-center gap-2'><input type='hidden' name='region_id' value={r.id} /><label className='w-48'>{r.name}</label><input name='multiplier' type='number' min='1' max='3' step='0.1' defaultValue={1} className='rounded bg-slate-900 p-2' /><button className='rounded bg-slate-800 px-3 py-2'>Save</button></form>)}</div>
  <div className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-2 font-semibold">Recent Changes</h2><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th>When</th><th>Base</th><th>Per Mile</th><th>Minimum</th></tr></thead><tbody>{history?.map((h:any)=><tr key={h.id} className="border-t border-slate-800"><td>{new Date(h.effective_from ?? h.created_at).toLocaleString()}</td><td>${Number(h.base_fare).toFixed(2)}</td><td>${Number(h.per_mile_rate).toFixed(2)}</td><td>${Number(h.minimum_fare).toFixed(2)}</td></tr>)}</tbody></table></div></div>
}
