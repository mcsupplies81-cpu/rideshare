export type VehicleType = 'base' | 'smooth' | 'xl'

export interface FareQuote {
  vehicle_type: VehicleType
  display_name: string
  fare: number
  multiplier: number
}
