export function calculateFare(params: {
  base_fare: number
  per_mile_rate: number
  distance_miles: number
  multiplier: number
  minimum_fare: number
}): { fare: number } {
  const { base_fare, per_mile_rate, distance_miles, multiplier, minimum_fare } = params

  return {
    fare: Math.max(
      minimum_fare,
      Math.round((base_fare + per_mile_rate * distance_miles) * multiplier * 100) / 100
    ),
  }
}
