import { z } from 'zod'

export const QuoteSchema = z.object({
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  dropoff_lat: z.number(),
  dropoff_lng: z.number(),
  promoCode: z.string().optional(),
})

export const CreateRideSchema = QuoteSchema.extend({
  vehicle_type: z.enum(['base', 'smooth', 'xl']),
  payment_method_id: z.string(),
  promoCode: z.string().optional(),
})

export const RateSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const CancelSchema = z.object({
  reason: z.string().optional(),
})
