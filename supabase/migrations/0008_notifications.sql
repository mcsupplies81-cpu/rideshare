create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  data jsonb,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "user sees own" on notifications
for all using (user_id = auth.uid());
