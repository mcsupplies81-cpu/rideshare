'use client'

type DriverMapProps = {
  driverLat?: number | null
  driverLng?: number | null
  pickupLat?: number | null
  pickupLng?: number | null
}

export default function DriverMap({ driverLat, driverLng, pickupLat, pickupLng }: DriverMapProps) {
  return (
    <div className="h-64 w-full rounded-xl border border-[#2B2B40] bg-[#151526] p-4 text-sm text-gray-300">
      <p className="mb-2 font-semibold text-white">Live route to pickup</p>
      <p>Driver: {driverLat ?? '--'}, {driverLng ?? '--'}</p>
      <p>Pickup: {pickupLat ?? '--'}, {pickupLng ?? '--'}</p>
    </div>
  )
}
