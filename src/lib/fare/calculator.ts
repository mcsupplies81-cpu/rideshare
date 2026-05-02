export function calculateFare(params: {
  base_fare: number
  per_mile_rate: number
  distance_miles: number
  multiplier: number
  surgeMultiplier?: number
  minimum_fare: number
}): { fare: number; breakdown: { surgeMultiplier: number } } {
  const { base_fare, per_mile_rate, distance_miles, multiplier, surgeMultiplier = 1, minimum_fare } = params

  const computedFare = (base_fare + per_mile_rate * distance_miles) * multiplier * surgeMultiplier

  return {
    fare: Math.max(minimum_fare, Math.round(computedFare * 100) / 100),
    breakdown: { surgeMultiplier },
  }
}
