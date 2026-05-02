create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric not null,
  max_uses integer,
  uses integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table promo_codes enable row level security;

create policy "read active" on promo_codes for select using (is_active = true);
