import { QuoteClient } from './QuoteClient'
import type { FareQuote } from '@/types/ride'

export default async function QuotePage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams
  const asString = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : (value ?? '')
  const queryParams = {
    pickup_lat: asString(searchParams.pickup_lat),
    pickup_lng: asString(searchParams.pickup_lng),
    pickup_address: asString(searchParams.pickup_address),
    dropoff_lat: asString(searchParams.dropoff_lat),
    dropoff_lng: asString(searchParams.dropoff_lng),
    dropoff_address: asString(searchParams.dropoff_address),
  }

  const query = new URLSearchParams(queryParams)
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/rides/quote?${query.toString()}`, { cache: 'no-store' })
  const data = await response.json()

  const fares: FareQuote[] = ['base', 'smooth', 'xl'].map((type) => ({
    vehicle_type: type as FareQuote['vehicle_type'],
    display_name: data.fares[type].display_name,
    fare: data.fares[type].fare,
    multiplier: data.fares[type].multiplier,
  }))

  return <main className='mx-auto max-w-md space-y-4 p-4'>
    <div className='rounded-lg bg-[#1A1A2E] p-4 text-sm text-gray-200'>{queryParams.pickup_address} → {queryParams.dropoff_address}</div>
    <QuoteClient fares={fares} queryParams={queryParams} />
  </main>
}
