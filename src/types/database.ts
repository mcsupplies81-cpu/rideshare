export type UserRole = 'rider' | 'driver' | 'admin'
export type VehicleType = 'base' | 'smooth' | 'xl'
export type RideStatus =
  | 'quoted'
  | 'payment_authorized'
  | 'searching'
  | 'accepted'
  | 'driver_arrived'
  | 'in_trip'
  | 'completed'
  | 'cancelled_by_rider'
  | 'cancelled_by_driver'
  | 'no_driver_found'
  | 'payment_failed'
export type ApprovalStatus = 'pending' | 'approved' | 'suspended' | 'rejected'
export type DocumentType = 'license' | 'insurance' | 'registration' | 'background_check' | 'profile_photo'
export type DocumentStatus = 'pending' | 'approved' | 'rejected'
export type PlanType = 'trial' | 'per_ride' | 'pro'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      riders: {
        Row: {
          id: string
          stripe_customer_id: string | null
          default_payment_method_id: string | null
          rating: number
          total_rides: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['riders']['Row'], 'rating' | 'total_rides' | 'created_at'>
        Update: Partial<Database['public']['Tables']['riders']['Insert']>
      }
      drivers: {
        Row: {
          id: string
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          approval_status: ApprovalStatus
          is_online: boolean
          last_online_at: string | null
          rating: number
          total_rides: number
          region_id: string | null
          trial_ends_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'stripe_connect_onboarded' | 'is_online' | 'rating' | 'total_rides' | 'created_at'>
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>
      }
      driver_documents: {
        Row: {
          id: string
          driver_id: string
          document_type: DocumentType
          storage_path: string
          status: DocumentStatus
          rejection_reason: string | null
          expires_at: string | null
          uploaded_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['driver_documents']['Row'], 'id' | 'status' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['driver_documents']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          driver_id: string
          make: string
          model: string
          year: number
          color: string
          license_plate: string
          vehicle_type: VehicleType
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'is_active' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      regions: {
        Row: {
          id: string
          name: string
          city: string
          state: string
          bounds: object | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['regions']['Insert']>
      }
      fare_settings: {
        Row: {
          id: string
          region_id: string | null
          base_fare: number
          per_mile_rate: number
          per_minute_rate: number
          minimum_fare: number
          effective_from: string
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['fare_settings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fare_settings']['Insert']>
      }
      vehicle_pricing: {
        Row: {
          id: string
          vehicle_type: VehicleType
          multiplier: number
          display_name: string
          description: string | null
          icon_url: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicle_pricing']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vehicle_pricing']['Insert']>
      }
      rides: {
        Row: {
          id: string
          rider_id: string
          driver_id: string | null
          vehicle_id: string | null
          vehicle_type: VehicleType
          status: RideStatus
          pickup_lat: number
          pickup_lng: number
          pickup_address: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_address: string
          estimated_miles: number | null
          actual_miles: number | null
          estimated_fare: number | null
          final_fare: number | null
          base_fare: number | null
          per_mile_rate: number | null
          vehicle_multiplier: number | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          payment_status: string | null
          requested_at: string
          accepted_at: string | null
          driver_arrived_at: string | null
          trip_started_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          rating_by_rider: number | null
          rating_by_driver: number | null
          region_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rides']['Row'], 'id' | 'requested_at' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rides']['Insert']>
      }
      ride_events: {
        Row: {
          id: string
          ride_id: string
          event_type: string
          actor_id: string | null
          metadata: object | null
          occurred_at: string
        }
        Insert: Omit<Database['public']['Tables']['ride_events']['Row'], 'id' | 'occurred_at'>
        Update: never
      }
      driver_locations: {
        Row: {
          driver_id: string
          lat: number
          lng: number
          heading: number | null
          speed: number | null
          updated_at: string
        }
        Insert: Database['public']['Tables']['driver_locations']['Row']
        Update: Partial<Database['public']['Tables']['driver_locations']['Insert']>
      }
      driver_plans: {
        Row: {
          id: string
          driver_id: string
          plan_type: PlanType
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          started_at: string
          ends_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['driver_plans']['Row'], 'id' | 'started_at' | 'is_active' | 'created_at'>
        Update: Partial<Database['public']['Tables']['driver_plans']['Insert']>
      }
      payments: {
        Row: {
          id: string
          ride_id: string | null
          rider_id: string | null
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          status: string
          captured_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      payouts: {
        Row: {
          id: string
          driver_id: string
          ride_id: string | null
          gross_amount: number
          platform_fee: number
          net_amount: number
          stripe_transfer_id: string | null
          status: PayoutStatus
          created_at: string
          paid_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          driver_id: string
          stripe_subscription_id: string
          stripe_customer_id: string | null
          status: string
          plan_type: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      ads: {
        Row: {
          id: string
          title: string
          body: string | null
          image_url: string | null
          cta_url: string | null
          target_role: UserRole | 'all' | null
          region_id: string | null
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ads']['Insert']>
      }
      ad_events: {
        Row: {
          id: string
          ad_id: string
          user_id: string | null
          event_type: 'impression' | 'click'
          occurred_at: string
        }
        Insert: Omit<Database['public']['Tables']['ad_events']['Row'], 'id' | 'occurred_at'>
        Update: never
      }
    }
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean }
      current_user_role: { Args: Record<never, never>; Returns: string }
    }
  }
}
