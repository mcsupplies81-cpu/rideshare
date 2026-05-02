create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id),
  code text unique not null,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create table referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references referral_codes(id),
  referred_driver_id uuid not null references drivers(id),
  credited_at timestamptz,
  created_at timestamptz not null default now()
);

alter table referral_codes enable row level security;
alter table referral_events enable row level security;

create policy "driver sees own code" on referral_codes
for select using (driver_id = auth.uid());

create policy "driver sees own referrals" on referral_events
for all using (
  referral_code_id in (select id from referral_codes where driver_id = auth.uid())
);
