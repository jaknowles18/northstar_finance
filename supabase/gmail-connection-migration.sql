-- Stores only an application-encrypted refresh token; raw email bodies are never stored.
create table if not exists public.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null,
  connected_email text,
  subject_filter text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gmail_connections enable row level security;
create policy "gmail connections own rows" on public.gmail_connections for all using (user_id=auth.uid()) with check (user_id=auth.uid());
