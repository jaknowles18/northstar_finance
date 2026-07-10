create table if not exists public.billing_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_cycle_name text not null default 'Main Credit Card',
  billing_period_start_date date not null,
  billing_period_end_date date not null,
  statement_due_date date not null,
  monthly_credit_limit numeric(12,2) check (monthly_credit_limit is null or monthly_credit_limit > 0),
  spending_warning_threshold numeric(5,2) default 80 check (spending_warning_threshold between 1 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.billing_settings enable row level security;
create policy "billing settings own rows" on public.billing_settings for all using (user_id=auth.uid()) with check (user_id=auth.uid());
notify pgrst, 'reload schema';

