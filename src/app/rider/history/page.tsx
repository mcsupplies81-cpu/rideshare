import Link from 'next/link'
import { Car } from 'lucide-react'

export default function RiderHistoryPage() {
  return <main className='flex min-h-[70vh] flex-col items-center justify-center gap-4 p-4 text-center'>
    <Car className='h-10 w-10 text-[#7B5EA7]' />
    <h1 className='text-2xl font-semibold'>No rides yet</h1>
    <Link href='/rider' className='rounded-lg bg-[#7B5EA7] px-4 py-2 font-semibold'>Book your first ride</Link>
  </main>
}
