export function FareBreakdown({ fare, distanceMiles, vehicleType }: { fare: number; distanceMiles: number; vehicleType: string }) {
  return (
    <div className='rounded-lg bg-[#1A1A2E] p-4'>
      <p className='text-3xl font-semibold text-white'>${fare.toFixed(2)}</p>
      <p className='text-sm text-gray-400'>{distanceMiles.toFixed(1)} mi · {vehicleType}</p>
    </div>
  )
}
