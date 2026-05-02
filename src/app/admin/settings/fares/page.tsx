import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function FaresPage({ searchParams }: { searchParams: Promise<{ region_id?: string }> }) {
  const params = await searchParams
  const s = (await createServiceClient()) as any
  const { data: regions } = await s.from('regions').select('id,name,is_active').order('name')
  const selectedRegionId = params.region_id ?? regions?.[0]?.id
  const [{ data: current }, { data: pricing }, { data: history }] = await Promise.all([
    s.from('fare_settings').select('*').eq('region_id', selectedRegionId).order('effective_from', { ascending: false }).limit(1).maybeSingle(),
    s.from('vehicle_pricing').select('*').eq('region_id', selectedRegionId).order('vehicle_type'),
    s.from('fare_settings').select('*').eq('region_id', selectedRegionId).order('effective_from', { ascending: false }).limit(5),
  ])

  async function updateBase(formData: FormData) { 'use server'; const s = await createServiceClient() as any; await s.from('fare_settings').insert({ region_id: formData.get('region_id'), base_fare: Number(formData.get('base_fare')), per_mile_rate: Number(formData.get('per_mile_rate')), minimum_fare: Number(formData.get('minimum_fare')), per_minute_rate: 0, effective_from: new Date().toISOString() }); revalidatePath('/admin/settings/fares') }

  return <div className='space-y-4 text-white'><h1 className='text-2xl font-bold'>Fare Settings</h1>
    {(regions?.length ?? 0) > 1 && <div className='flex gap-2'>{regions.map((r:any)=><Link key={r.id} href={`/admin/settings/fares?region_id=${r.id}`} className={`rounded-full px-4 py-2 text-sm ${selectedRegionId===r.id?'bg-purple-600':'bg-slate-800'}`}>{r.name}</Link>)}</div>}
    <form action={updateBase} className='space-y-2 rounded-xl bg-[#1A1A2E] p-4'><input type='hidden' name='region_id' value={selectedRegionId} /><input name='base_fare' type='number' step='0.01' defaultValue={current?.base_fare ?? 0} className='w-full rounded bg-slate-900 p-2' /><input name='per_mile_rate' type='number' step='0.01' defaultValue={current?.per_mile_rate ?? 0} className='w-full rounded bg-slate-900 p-2' /><input name='minimum_fare' type='number' step='0.01' defaultValue={current?.minimum_fare ?? 0} className='w-full rounded bg-slate-900 p-2' /><button className='rounded bg-purple-600 px-4 py-2'>Save</button></form>
    <div className='rounded-xl bg-[#1A1A2E] p-4'>{pricing?.map((v:any)=><div key={v.id ?? v.vehicle_type}>{v.vehicle_type}: {v.multiplier}x</div>)}</div>
    <div className='rounded-xl bg-[#1A1A2E] p-4'>{history?.map((h:any)=><div key={h.id}>{new Date(h.effective_from ?? h.created_at).toLocaleString()} - ${h.base_fare}</div>)}</div>
  </div>
}
