import { z } from 'zod'

export const PromoCodeSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/),
  discount_type: z.enum(['percent', 'flat']),
  discount_value: z.number().positive(),
  max_uses: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
})

export const FareSettingsSchema = z.object({
  base_fare: z.number().positive(),
  per_mile: z.number().positive(),
  per_minute: z.number().nonnegative(),
  minimum_fare: z.number().positive(),
  region_id: z.string().uuid(),
})

export const SurgeSchema = z.object({
  region_id: z.string().uuid(),
  multiplier: z.number().min(1).max(5),
})
