-- A verified provider cancellation is queued for review. No cash balance,
-- refund, old payment or customer record is modified by this migration.
begin;
create table if not exists public.payment_cancellation_reviews (
  payment_id text not null,
  cancelled_krw bigint not null check (cancelled_krw > 0),
  total_krw bigint not null check (total_krw >= cancelled_krw),
  provider_status text not null check (provider_status in ('PARTIAL_CANCELLED','CANCELLED')),
  observed_at timestamptz not null default now(),
  primary key(payment_id, cancelled_krw)
);
alter table public.payment_cancellation_reviews enable row level security;
revoke all on public.payment_cancellation_reviews from public, anon, authenticated;
grant select, insert on public.payment_cancellation_reviews to service_role;
commit;
