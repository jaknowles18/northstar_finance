-- Preserve the amount parsed from the source email when a user adjusts a transaction.
-- `amount` remains the effective value used by dashboards and analytics.
alter table public.transactions
  add column if not exists original_amount numeric(12,2)
  check (original_amount >= 0);

comment on column public.transactions.original_amount is
  'Original parsed amount, captured on the first manual adjustment. Null until adjusted.';
