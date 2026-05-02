export interface FareBreakdown {
  surgeMultiplier: number
}

export interface FareResult {
  fare: number
  breakdown: FareBreakdown
}

export interface CalculateFareParams {
  base_fare: number
  per_mile_rate: number
  distance_miles: number
  multiplier: number
  surgeMultiplier?: number
  minimum_fare: number
}

/**
 * Computes fare from pricing inputs without side effects.
 */
export function calculateFare(params: CalculateFareParams): FareResult {
  const {
    base_fare,
    per_mile_rate,
    distance_miles,
    multiplier,
    surgeMultiplier = 1,
    minimum_fare,
  } = params

  const computedFare = (base_fare + per_mile_rate * distance_miles) * multiplier * surgeMultiplier

  return {
    fare: Math.max(minimum_fare, Math.round(computedFare * 100) / 100),
    breakdown: { surgeMultiplier },
  }
}
