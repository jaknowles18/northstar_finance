-- Every user-owned table is protected by RLS. The browser anon key cannot cross user boundaries.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.imports enable row level security;

create policy "profiles own rows" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "categories own rows" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "merchants own rows" on public.merchants for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "merchant rules own rows" on public.merchant_rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions own rows" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "imports own rows" on public.imports for all using (user_id = auth.uid()) with check (user_id = auth.uid());

