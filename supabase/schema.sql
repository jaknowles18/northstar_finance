-- Northstar schema. Run this first in the Supabase SQL editor, then policies.sql.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, color text not null default '#5B8C6B', icon text, created_at timestamptz not null default now(),
  unique(user_id, name)
);
create table public.merchants (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  raw_name text not null, normalized_name text not null, category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(), unique(user_id, raw_name)
);
create table public.merchant_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  match_text text not null, normalized_name text not null, category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id, match_text)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date, posted_at timestamptz, amount numeric(12,2) not null check (amount >= 0), currency text not null default 'CAD',
  raw_merchant text not null, normalized_merchant text not null, merchant_id uuid references public.merchants(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null, source text not null default 'rbc_email', email_hash text,
  confidence numeric(3,2) check (confidence between 0 and 1), notes text, created_at timestamptz not null default now()
);
create unique index transactions_user_email_hash_idx on public.transactions(user_id, email_hash) where email_hash is not null;
create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index transactions_user_category_idx on public.transactions(user_id, category_id);
create table public.imports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source text not null, imported_count integer not null default 0, duplicate_count integer not null default 0,
  failed_count integer not null default 0, created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, email) values(new.id, new.email); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

