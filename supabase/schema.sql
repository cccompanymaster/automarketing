-- 마케팅방주 — 인증 + 캐시(포인트) 스키마
-- Supabase SQL Editor에 붙여넣어 실행하세요. (1원 = 1캐시)
-- 인증(회원가입/로그인)은 Supabase Auth가 담당하므로 별도 user 테이블은 불필요합니다.

-- 캐시 거래 원장 ------------------------------------------------------------
create table if not exists public.cash_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null check (type in ('charge','use','refund','bonus')),
  amount        bigint not null,            -- 부호 있는 캐시 증감 (충전 +, 사용 -)
  balance_after bigint not null,            -- 거래 직후 잔액
  memo          text default '',
  created_at    timestamptz not null default now()
);

create index if not exists cash_transactions_user_created_idx
  on public.cash_transactions (user_id, created_at desc);

-- RLS: 본인 내역만 조회 가능 -----------------------------------------------
alter table public.cash_transactions enable row level security;

drop policy if exists "own rows readable" on public.cash_transactions;
create policy "own rows readable"
  on public.cash_transactions for select
  using (auth.uid() = user_id);

-- 충전 RPC ------------------------------------------------------------------
-- 보안: 이 함수는 "돈을 만드는" 함수이므로 클라이언트가 직접 호출하면 결제 없이
-- 무한 충전이 가능합니다. 따라서 PostgREST 노출을 막고 service_role 에서만 호출
-- 가능하게 합니다(아래 GRANT/REVOKE). 실제 충전은 PG 웹훅이 결제를 서버에서
-- 검증한 뒤, service_role 로 p_uid 를 지정해 호출해야 합니다.
create or replace function public.charge_cash(p_amount bigint, p_memo text, p_uid uuid default auth.uid())
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(p_uid, auth.uid());
  v_balance bigint;
begin
  if v_uid is null then
    raise exception 'user is required';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  -- Serialize concurrent ledger writes for this user.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select coalesce((
    select balance_after from public.cash_transactions
    where user_id = v_uid order by created_at desc limit 1
  ), 0) into v_balance;

  v_balance := v_balance + p_amount;

  insert into public.cash_transactions (user_id, type, amount, balance_after, memo)
  values (v_uid, 'charge', p_amount, v_balance, coalesce(p_memo, '충전'));

  return v_balance;
end;
$$;

-- 사용(주문) RPC: 잔액에서 차감하고 원장에 기록. 잔액 부족 시 예외. ----------
create or replace function public.use_cash(p_amount bigint, p_memo text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance bigint;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  -- Serialize concurrent spends for this user to prevent double-spend races.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select coalesce((
    select balance_after from public.cash_transactions
    where user_id = v_uid order by created_at desc limit 1
  ), 0) into v_balance;

  if v_balance < p_amount then
    raise exception '캐시가 부족합니다';
  end if;

  v_balance := v_balance - p_amount;

  insert into public.cash_transactions (user_id, type, amount, balance_after, memo)
  values (v_uid, 'use', -p_amount, v_balance, coalesce(p_memo, '사용'));

  return v_balance;
end;
$$;

-- 함수 권한 (보안 경계) -----------------------------------------------------
-- charge_cash 는 결제 검증을 거친 서버(service_role)에서만 호출 가능해야 합니다.
-- PostgREST 를 통한 클라이언트(anon/authenticated) 직접 호출을 차단합니다.
revoke all on function public.charge_cash(bigint, text, uuid) from public, anon, authenticated;
grant execute on function public.charge_cash(bigint, text, uuid) to service_role;

-- use_cash 는 본인 잔액에서 차감하므로 로그인 사용자가 호출 가능합니다.
revoke all on function public.use_cash(bigint, text) from public, anon;
grant execute on function public.use_cash(bigint, text) to authenticated, service_role;

-- 주문 테이블 --------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_name text not null,
  amount_cash  bigint not null,
  qty          integer not null default 1,
  status       text not null default 'received'
                 check (status in ('received','in_progress','done','canceled')),
  created_at   timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

-- 본인 주문만 조회 가능.
drop policy if exists "own orders readable" on public.orders;
create policy "own orders readable"
  on public.orders for select
  using (auth.uid() = user_id);

-- 본인 주문만 생성 가능 (결제 차감 성공 후 기록).
drop policy if exists "own orders insertable" on public.orders;
create policy "own orders insertable"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- 상태 변경(UPDATE)/삭제는 클라이언트에 허용하지 않습니다. 관리자 상태 변경은
-- 서버(service_role) 또는 is_admin() 정책을 둔 update_order_status RPC로 처리하세요.
-- (정의된 UPDATE/DELETE 정책이 없으므로 anon/authenticated 의 변경은 거부됩니다.)

-- 결제 멱등 처리 + 적립 RPC --------------------------------------------------
-- 결제 웹훅이 재전송돼도 중복 적립되지 않도록, payment_id 를 유일 키로 기록합니다.
create table if not exists public.payment_events (
  payment_id text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     bigint not null,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
-- 클라이언트 정책 없음 → service_role(웹훅)에서만 접근.

-- credit_payment: 검증된 결제 1건을 멱등하게 적립. service_role 전용.
create or replace function public.credit_payment(
  p_payment_id text,
  p_amount bigint,
  p_uid uuid,
  p_memo text default '충전'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  if p_uid is null then
    raise exception 'user is required';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  -- 사용자별 직렬화 후 멱등 확인.
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 0));

  select coalesce((
    select balance_after from public.cash_transactions
    where user_id = p_uid order by created_at desc limit 1
  ), 0) into v_balance;

  -- 이미 처리된 결제면 적립하지 않고 현재 잔액 반환.
  if exists (select 1 from public.payment_events where payment_id = p_payment_id) then
    return v_balance;
  end if;

  insert into public.payment_events (payment_id, user_id, amount)
  values (p_payment_id, p_uid, p_amount);

  v_balance := v_balance + p_amount;
  insert into public.cash_transactions (user_id, type, amount, balance_after, memo)
  values (p_uid, 'charge', p_amount, v_balance, coalesce(p_memo, '충전'));

  return v_balance;
end;
$$;

revoke all on function public.credit_payment(text, bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.credit_payment(text, bigint, uuid, text) to service_role;
