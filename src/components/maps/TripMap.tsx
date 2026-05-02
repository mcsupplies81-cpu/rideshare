'use client'

type TripMapProps = {
  driverLat?: number | null
  driverLng?: number | null
  pickupLat?: number | null
  pickupLng?: number | null
  dropoffLat?: number | null
  dropoffLng?: number | null
}

export default function TripMap({ driverLat, driverLng, pickupLat, pickupLng, dropoffLat, dropoffLng }: TripMapProps) {
  return (
    <div className="h-72 w-full rounded-xl border border-[#2B2B40] bg-[#151526] p-4 text-sm text-gray-300">
      <p className="mb-2 font-semibold text-white">Live trip map</p>
      <p>Driver: {driverLat ?? '--'}, {driverLng ?? '--'}</p>
      <p>Pickup: {pickupLat ?? '--'}, {pickupLng ?? '--'}</p>
      <p>Dropoff: {dropoffLat ?? '--'}, {dropoffLng ?? '--'}</p>
    </div>
  )
}
