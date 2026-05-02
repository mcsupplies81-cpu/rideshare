import { Skeleton } from '@/components/shared/Skeleton'

export default function Loading() {
  return <div className="space-y-4">
    <Skeleton className="h-8 w-40" />
    <div className="rounded-xl bg-[#1A1A2E] p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  </div>
}
