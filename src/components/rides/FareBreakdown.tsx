export function FareBreakdown({ fare, distanceMiles, vehicleType }: { fare: number; distanceMiles: number; vehicleType: string }) {
  return (
    <div>
      <p className="text-4xl font-bold text-white">${fare.toFixed(2)}</p>
      <p className="text-sm text-gray-400">{distanceMiles.toFixed(1)} mi · {vehicleType}</p>
    </div>
  )
}
