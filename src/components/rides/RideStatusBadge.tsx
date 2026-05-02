type RideStatus = string

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  quoted: { label: 'Quoted', color: 'bg-gray-700 text-gray-300' },
  payment_authorized: { label: 'Payment Authorized', color: 'bg-blue-900/50 text-blue-300' },
  searching: { label: 'Finding Driver', color: 'bg-yellow-900/50 text-yellow-300' },
  accepted: { label: 'Driver Accepted', color: 'bg-purple-900/50 text-purple-300' },
  driver_arrived: { label: 'Driver Arrived', color: 'bg-indigo-900/50 text-indigo-300' },
  in_trip: { label: 'In Progress', color: 'bg-green-900/50 text-green-300' },
  completed: { label: 'Completed', color: 'bg-green-900/70 text-green-200' },
  cancelled_by_rider: { label: 'Cancelled', color: 'bg-red-900/50 text-red-300' },
  cancelled_by_driver: { label: 'Driver Cancelled', color: 'bg-red-900/50 text-red-300' },
  no_driver_found: { label: 'No Driver Found', color: 'bg-orange-900/50 text-orange-300' },
  payment_failed: { label: 'Payment Failed', color: 'bg-red-900/70 text-red-200' },
}

export default function RideStatusBadge({ status }: { status: RideStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-700 text-gray-400' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}
