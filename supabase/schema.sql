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
-- 주의: 실제 현금 결제는 반드시 PG 웹훅으로 서버에서 검증한 뒤 호출해야 합니다.
-- 아래 함수는 검증된 충전을 원장에 원자적으로 기록합니다. (개발/연동용)
create or replace function public.charge_cash(p_amount bigint, p_memo text)
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
