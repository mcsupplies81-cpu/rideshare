import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function PromoCodesPage() {
  const s = await createServiceClient() as any
  const { data: promoCodes } = await (s as any).from('promo_codes').select('*').order('created_at', { ascending: false })

  async function createPromoCode(formData: FormData) {
    'use server'
    const supabase = await createServiceClient() as any
    await (supabase as any).from('promo_codes').insert({
      code: String(formData.get('code') ?? '').trim(),
      discount_type: formData.get('discount_type'),
      discount_value: Number(formData.get('discount_value')),
      max_uses: formData.get('max_uses') ? Number(formData.get('max_uses')) : null,
      expires_at: formData.get('expires_at') ? new Date(String(formData.get('expires_at'))).toISOString() : null,
    })
    revalidatePath('/admin/settings/promo-codes')
  }

  return <div className='space-y-6 text-white'>
    <h1 className='text-2xl font-bold'>Promo Codes</h1>
    <form action={createPromoCode} className='grid gap-2 rounded-xl bg-[#1A1A2E] p-4 md:grid-cols-5'>
      <input name='code' placeholder='Code' className='rounded bg-slate-900 p-2' required />
      <select name='discount_type' className='rounded bg-slate-900 p-2'>
        <option value='percent'>percent</option><option value='flat'>flat</option>
      </select>
      <input name='discount_value' type='number' step='0.01' placeholder='Discount value' className='rounded bg-slate-900 p-2' required />
      <input name='max_uses' type='number' placeholder='Max uses' className='rounded bg-slate-900 p-2' />
      <input name='expires_at' type='date' className='rounded bg-slate-900 p-2' />
      <button className='rounded bg-purple-600 px-4 py-2 md:col-span-5'>Create Promo Code</button>
    </form>
    <div className='rounded-xl bg-[#1A1A2E] p-4'>
      <table className='w-full text-sm'><thead><tr className='text-left text-slate-400'><th>Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Expires</th><th>Active</th></tr></thead>
      <tbody>{promoCodes?.map((p: any) => <tr key={p.id} className='border-t border-slate-800'><td>{p.code}</td><td>{p.discount_type}</td><td>{p.discount_value}</td><td>{p.uses}/{p.max_uses ?? '∞'}</td><td>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td><td>{p.is_active ? 'Yes' : 'No'}</td></tr>)}</tbody></table>
    </div>
  </div>
}
