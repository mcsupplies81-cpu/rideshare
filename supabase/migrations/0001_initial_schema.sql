-- Enable required extensions
create extension if not exists "uuid-ossp";

-- REGIONS (referenced by other tables)
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  bounds jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- USERS (mirrors auth.users, extended with role)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'rider' check (role in ('rider', 'driver', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RIDERS
create table public.riders (
  id uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id text unique,
  default_payment_method_id text,
  rating numeric(3,2) not null default 5.00,
  total_rides integer not null default 0,
  created_at timestamptz not null default now()
);

-- DRIVERS
create table public.drivers (
  id uuid primary key references public.users(id) on delete cascade,
  stripe_connect_account_id text unique,
  stripe_connect_onboarded boolean not null default false,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'suspended', 'rejected')),
  is_online boolean not null default false,
  last_online_at timestamptz,
  rating numeric(3,2) not null default 5.00,
  total_rides integer not null default 0,
  region_id uuid references public.regions(id),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- DRIVER DOCUMENTS
create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  document_type text not null
    check (document_type in ('license', 'insurance', 'registration', 'background_check', 'profile_photo')),
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  expires_at date,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id)
);

-- VEHICLES
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null check (year between 2005 and 2030),
  color text not null,
  license_plate text not null,
  vehicle_type text not null check (vehicle_type in ('base', 'smooth', 'xl')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- FARE SETTINGS
create table public.fare_settings (
  id uuid primary key default gen_random_uuid(),
  region_id uuid references public.regions(id),
  base_fare numeric(10,2) not null default 2.00,
  per_mile_rate numeric(10,2) not null default 0.90,
  per_minute_rate numeric(10,2) not null default 0.00,
  minimum_fare numeric(10,2) not null default 5.00,
  effective_from timestamptz not null default now(),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- VEHICLE PRICING MULTIPLIERS
create table public.vehicle_pricing (
  id uuid primary key default gen_random_uuid(),
  vehicle_type text not null unique
    check (vehicle_type in ('base', 'smooth', 'xl')),
  multiplier numeric(4,2) not null,
  display_name text not null,
  description text,
  icon_url text,
  updated_at timestamptz not null default now()
);

-- RIDES
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id),
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  vehicle_type text not null check (vehicle_type in ('base', 'smooth', 'xl')),
  status text not null default 'quoted'
    check (status in (
      'quoted', 'payment_authorized', 'searching', 'accepted',
      'driver_arrived', 'in_trip', 'completed',
      'cancelled_by_rider', 'cancelled_by_driver',
      'no_driver_found', 'payment_failed'
    )),
  -- location
  pickup_lat numeric(10,7) not null,
  pickup_lng numeric(10,7) not null,
  pickup_address text not null,
  dropoff_lat numeric(10,7) not null,
  dropoff_lng numeric(10,7) not null,
  dropoff_address text not null,
  -- fare
  estimated_miles numeric(8,2),
  actual_miles numeric(8,2),
  estimated_fare numeric(10,2),
  final_fare numeric(10,2),
  base_fare numeric(10,2),
  per_mile_rate numeric(10,2),
  vehicle_multiplier numeric(4,2),
  -- payment
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  payment_status text,
  -- timing
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  driver_arrived_at timestamptz,
  trip_started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  -- metadata
  cancellation_reason text,
  rating_by_rider integer check (rating_by_rider between 1 and 5),
  rating_by_driver integer check (rating_by_driver between 1 and 5),
  region_id uuid references public.regions(id),
  created_at timestamptz not null default now()
);

-- RIDE EVENTS (state machine audit log)
create table public.ride_events (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  event_type text not null,
  actor_id uuid references public.users(id),
  metadata jsonb,
  occurred_at timestamptz not null default now()
);

-- DRIVER LOCATIONS (latest position per driver)
create table public.driver_locations (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  heading numeric(5,2),
  speed numeric(6,2),
  updated_at timestamptz not null default now()
);

-- DRIVER PLANS
create table public.driver_plans (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  plan_type text not null check (plan_type in ('trial', 'per_ride', 'pro')),
  stripe_subscription_id text unique,
  stripe_subscription_status text,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- PAYMENTS
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references public.rides(id),
  rider_id uuid references public.riders(id),
  amount numeric(10,2) not null,
  currency text not null default 'usd',
  stripe_payment_intent_id text unique,
  status text not null,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

-- PAYOUTS
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  ride_id uuid references public.rides(id),
  gross_amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  net_amount numeric(10,2) not null,
  stripe_transfer_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  stripe_subscription_id text unique not null,
  stripe_customer_id text,
  status text not null,
  plan_type text not null default 'pro',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ADS
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  cta_url text,
  target_role text check (target_role in ('rider', 'driver', 'all')),
  region_id uuid references public.regions(id),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- AD EVENTS
create table public.ad_events (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid references public.users(id),
  event_type text not null check (event_type in ('impression', 'click')),
  occurred_at timestamptz not null default now()
);

-- INDEXES
create index idx_rides_rider_id on public.rides(rider_id);
create index idx_rides_driver_id on public.rides(driver_id);
create index idx_rides_status on public.rides(status);
create index idx_rides_completed_at on public.rides(completed_at);
create index idx_driver_locations_updated on public.driver_locations(updated_at);
create index idx_ride_events_ride_id on public.ride_events(ride_id);
create index idx_payouts_driver_id on public.payouts(driver_id);
create index idx_drivers_approval_status on public.drivers(approval_status);
create index idx_drivers_is_online on public.drivers(is_online);
create index idx_driver_plans_driver_id on public.driver_plans(driver_id);
create index idx_payments_ride_id on public.payments(ride_id);

-- TRIGGER: auto-create users row on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, phone, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'rider')
  )
  on conflict (id) do nothing;

  -- Create rider or driver profile based on role
  if coalesce(new.raw_user_meta_data->>'role', 'rider') = 'rider' then
    insert into public.riders (id) values (new.id) on conflict (id) do nothing;
  elsif new.raw_user_meta_data->>'role' = 'driver' then
    insert into public.drivers (id) values (new.id) on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
