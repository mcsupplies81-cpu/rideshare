-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.riders enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_documents enable row level security;
alter table public.vehicles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_events enable row level security;
alter table public.driver_locations enable row level security;
alter table public.driver_plans enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.fare_settings enable row level security;
alter table public.vehicle_pricing enable row level security;
alter table public.regions enable row level security;
alter table public.ads enable row level security;
alter table public.ad_events enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: get current user role
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- USERS
create policy "users_select" on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy "users_update_own" on public.users
  for update using (id = auth.uid());
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

-- RIDERS
create policy "riders_select" on public.riders
  for select using (id = auth.uid() or public.is_admin());
create policy "riders_insert_own" on public.riders
  for insert with check (id = auth.uid());
create policy "riders_update_own" on public.riders
  for update using (id = auth.uid());

-- DRIVERS
create policy "drivers_select" on public.drivers
  for select using (id = auth.uid() or public.is_admin());
create policy "drivers_update_own" on public.drivers
  for update using (id = auth.uid() or public.is_admin());
create policy "drivers_insert_own" on public.drivers
  for insert with check (id = auth.uid());

-- DRIVER DOCUMENTS
create policy "documents_select" on public.driver_documents
  for select using (driver_id = auth.uid() or public.is_admin());
create policy "documents_insert_own" on public.driver_documents
  for insert with check (driver_id = auth.uid());
create policy "documents_update_admin" on public.driver_documents
  for update using (public.is_admin());

-- VEHICLES
create policy "vehicles_select" on public.vehicles
  for select using (driver_id = auth.uid() or public.is_admin());
create policy "vehicles_insert_own" on public.vehicles
  for insert with check (driver_id = auth.uid());
create policy "vehicles_update_own" on public.vehicles
  for update using (driver_id = auth.uid() or public.is_admin());

-- RIDES
create policy "rides_select" on public.rides
  for select using (
    rider_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
  );
create policy "rides_insert_rider" on public.rides
  for insert with check (rider_id = auth.uid());
create policy "rides_update_parties" on public.rides
  for update using (
    rider_id = auth.uid() or driver_id = auth.uid() or public.is_admin()
  );

-- RIDE EVENTS
create policy "ride_events_select" on public.ride_events
  for select using (
    exists (
      select 1 from public.rides
      where rides.id = ride_events.ride_id
        and (rides.rider_id = auth.uid() or rides.driver_id = auth.uid())
    )
    or public.is_admin()
  );
create policy "ride_events_insert" on public.ride_events
  for insert with check (
    exists (
      select 1 from public.rides
      where rides.id = ride_events.ride_id
        and (rides.rider_id = auth.uid() or rides.driver_id = auth.uid())
    )
    or public.is_admin()
  );

-- DRIVER LOCATIONS
create policy "locations_select" on public.driver_locations
  for select using (
    driver_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.rides
      where rides.driver_id = driver_locations.driver_id
        and rides.rider_id = auth.uid()
        and rides.status in ('accepted', 'driver_arrived', 'in_trip')
    )
  );
create policy "locations_upsert_own" on public.driver_locations
  for all using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

-- DRIVER PLANS
create policy "driver_plans_select" on public.driver_plans
  for select using (driver_id = auth.uid() or public.is_admin());
create policy "driver_plans_admin" on public.driver_plans
  for all using (public.is_admin());

-- PAYMENTS
create policy "payments_select" on public.payments
  for select using (rider_id = auth.uid() or public.is_admin());

-- PAYOUTS
create policy "payouts_select" on public.payouts
  for select using (driver_id = auth.uid() or public.is_admin());

-- SUBSCRIPTIONS
create policy "subscriptions_select" on public.subscriptions
  for select using (driver_id = auth.uid() or public.is_admin());

-- FARE SETTINGS (public read, admin write)
create policy "fare_settings_select" on public.fare_settings
  for select using (auth.role() = 'authenticated');
create policy "fare_settings_admin" on public.fare_settings
  for all using (public.is_admin());

-- VEHICLE PRICING (public read)
create policy "vehicle_pricing_select" on public.vehicle_pricing
  for select using (true);
create policy "vehicle_pricing_admin" on public.vehicle_pricing
  for all using (public.is_admin());

-- REGIONS (public read)
create policy "regions_select" on public.regions
  for select using (true);
create policy "regions_admin" on public.regions
  for all using (public.is_admin());

-- ADS
create policy "ads_select_active" on public.ads
  for select using (is_active = true or public.is_admin());
create policy "ads_admin" on public.ads
  for all using (public.is_admin());

-- AD EVENTS
create policy "ad_events_insert" on public.ad_events
  for insert with check (auth.role() = 'authenticated');
create policy "ad_events_select" on public.ad_events
  for select using (user_id = auth.uid() or public.is_admin());
