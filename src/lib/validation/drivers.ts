import { z } from 'zod'

export const LocationSchema = z.object({ lat: z.number(), lng: z.number() })
export const StatusSchema = z.object({ is_online: z.boolean() })
export const VehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  color: z.string().min(1),
  license_plate: z.string().min(1),
  vehicle_type: z.enum(['base', 'smooth', 'xl']),
})
