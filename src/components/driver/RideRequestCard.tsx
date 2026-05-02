type Props = { ride: any; onAccept: () => void; onDecline: () => void; timeRemaining: number }

export function RideRequestCard({ ride, onAccept, onDecline, timeRemaining }: Props) {
  const pct = Math.max(0, (timeRemaining / 30) * 100)
  return (
    <div className="space-y-4 rounded-xl border p-5">
      <h1 className="text-2xl font-semibold">New ride request</h1>
      <p className="text-lg font-medium">{ride.pickup_address}</p>
      <p>{ride.dropoff_address}</p>
      <p>Estimated fare: ${Number(ride.estimated_fare ?? 0).toFixed(2)}</p>
      <span className="inline-block rounded bg-gray-100 px-3 py-1 text-sm">4 min away</span>
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-8 border-purple-300" style={{ opacity: pct / 100 }}>{timeRemaining}s</div>
      <button onClick={onAccept} className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">ACCEPT</button>
      <button onClick={onDecline} className="w-full rounded-lg border px-4 py-2">DECLINE</button>
    </div>
  )
}
