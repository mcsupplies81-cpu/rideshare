import Link from 'next/link'
import { Car } from 'lucide-react'

export default function RiderHistoryPage() {
  return <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-white"><Car className="h-10 w-10 text-[#7B5EA7]" /><p className="text-xl">No rides yet</p><Link href="/rider" className="rounded-xl bg-[#7B5EA7] px-4 py-2">Book your first ride</Link></main>
}
