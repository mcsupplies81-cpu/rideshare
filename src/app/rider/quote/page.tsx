import { QuoteSelector } from '@/components/rides/QuoteSelector'
import { FareQuote } from '@/types/ride'

export default async function QuotePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const qs = new URLSearchParams(params)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/rides/quote?${qs.toString()}`, { cache: 'no-store' })
  const data = await res.json()

  const fares: FareQuote[] = [data.fares.base, data.fares.smooth, data.fares.xl].map((fare: FareQuote, i: number) => ({ ...fare, display_name: fare.display_name ?? ['Standard', 'Smooth', 'XL'][i], multiplier: fare.multiplier ?? [1,1.3,1.5][i] }))

  return <main className="mx-auto max-w-md space-y-4 p-4 text-white"><p className="text-sm text-gray-300">{params.pickup_address} → {params.dropoff_address}</p><QuoteSelector fares={fares} params={params} /></main>
}
