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

-- 주문 생성은 place_order RPC(캐시 차감과 한 트랜잭션)로만 가능합니다 — 아래 참고.
-- 클라이언트 INSERT 정책은 두지 않습니다(결제 없이 주문 행을 만들 수 있었음).

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

-- 관리자 판별 -----------------------------------------------------------------
-- NEXT_PUBLIC_ADMIN_EMAILS 는 UI 노출용일 뿐이므로, 서버 측 판별용으로 관리자
-- 이메일을 이 테이블에 등록하세요. 예:
--   insert into public.admin_users (email) values ('cccompanymaster@gmail.com')
--   on conflict do nothing;
create table if not exists public.admin_users (
  email text primary key
);

alter table public.admin_users enable row level security;
-- 클라이언트 정책 없음 → 목록은 service_role/SQL 에서만 관리.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 산출물(고객 컨펌) -------------------------------------------------------------
-- 관리자가 작업 결과(원고 등)를 업로드하면 고객이 마이페이지에서 승인하거나
-- 수정을 요청합니다. 업로드는 관리자 RPC, 리뷰는 소유자 RPC로만 변경됩니다.
create table if not exists public.deliverables (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  user_email  text not null,
  order_id    uuid references public.orders (id) on delete set null,
  title       text not null,
  content     text not null,
  status      text not null default 'pending_review'
                check (status in ('pending_review','approved','revision_requested')),
  feedback    text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists deliverables_user_created_idx
  on public.deliverables (user_id, created_at desc);

alter table public.deliverables enable row level security;

-- 본인 것 + 관리자는 전체 조회.
drop policy if exists "deliverables readable" on public.deliverables;
create policy "deliverables readable"
  on public.deliverables for select
  using (auth.uid() = user_id or public.is_admin());
-- INSERT/UPDATE 정책 없음 → 아래 RPC 로만 변경 가능.

-- 관리자: 이메일로 회원을 찾아 산출물 업로드.
create or replace function public.admin_upload_deliverable(
  p_email text,
  p_title text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(p_email) limit 1;
  if v_uid is null then
    raise exception '해당 이메일의 회원을 찾을 수 없습니다: %', p_email;
  end if;
  insert into public.deliverables (user_id, user_email, title, content)
  values (v_uid, lower(p_email), p_title, p_content)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.admin_upload_deliverable(text, text, text) from public, anon;
grant execute on function public.admin_upload_deliverable(text, text, text) to authenticated;

-- 소유자: 대기 중 산출물을 승인하거나 수정 요청(피드백 필수 아님) 처리.
create or replace function public.review_deliverable(
  p_id uuid,
  p_approve boolean,
  p_feedback text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.deliverables
     set status      = case when p_approve then 'approved' else 'revision_requested' end,
         feedback    = case when p_approve then feedback else coalesce(p_feedback, feedback) end,
         reviewed_at = now()
   where id = p_id
     and user_id = auth.uid()
     and status = 'pending_review';
  if not found then
    raise exception '처리할 수 없는 요청입니다 (이미 처리되었거나 권한이 없습니다).';
  end if;
end;
$$;

revoke all on function public.review_deliverable(uuid, boolean, text) from public, anon;
grant execute on function public.review_deliverable(uuid, boolean, text) to authenticated;

-- 동의 이력 (제3자 제공 등) ----------------------------------------------------
-- 개인정보 제3자 제공은 "동의를 받았다"는 사실을 입증할 수 있어야 하므로,
-- 가입·변경 시점의 동의 상태를 append-only 로 적재합니다. 최신 상태는 가장
-- 최근 행(created_at desc)이며, 과거 행은 수정·삭제하지 않습니다.
create table if not exists public.consent_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  terms        boolean not null default false,
  privacy      boolean not null default false,
  third_party  boolean not null default false,  -- 제3자 정보제공 (선택)
  marketing    boolean not null default false,  -- 마케팅 정보 수신 (선택)
  doc_version  text not null default '2026-08-01',
  source       text not null default 'signup'   -- signup | mypage
                 check (source in ('signup','mypage')),
  created_at   timestamptz not null default now()
);

create index if not exists consent_logs_user_created_idx
  on public.consent_logs (user_id, created_at desc);

alter table public.consent_logs enable row level security;

-- 본인 이력 조회 + 관리자 전체 조회.
drop policy if exists "own consents readable" on public.consent_logs;
create policy "own consents readable"
  on public.consent_logs for select
  using (auth.uid() = user_id or public.is_admin());

-- 본인 동의 기록 추가만 허용 (수정·삭제 정책 없음 → append-only).
drop policy if exists "own consents insertable" on public.consent_logs;
create policy "own consents insertable"
  on public.consent_logs for insert
  with check (auth.uid() = user_id);

-- 최신 동의 상태 조회용 뷰 (사용자별 1행).
-- security_invoker: 뷰는 기본적으로 소유자 권한으로 실행돼 RLS를 우회하고,
-- public 스키마 뷰는 API로 노출되므로 이게 없으면 누구나 전 회원의 동의
-- 이력을 읽을 수 있습니다. 호출자 권한으로 실행해 consent_logs RLS를 따르게 합니다.
create or replace view public.current_consents
with (security_invoker = true) as
select distinct on (user_id)
  user_id, terms, privacy, third_party, marketing, doc_version, source, created_at
from public.consent_logs
order by user_id, created_at desc;

-- 주문 생성 (원자적) -------------------------------------------------------------
-- 캐시 차감과 주문 기록을 한 트랜잭션으로 처리합니다. 예전에는 클라이언트가
-- use_cash 후 orders 에 직접 insert 해서 (1) 결제 없이 주문 행을 만들 수 있었고
-- (2) 차감 후 기록이 실패하면 돈만 빠지고 주문이 사라졌습니다.
alter table public.orders add column if not exists request text;

drop policy if exists "own orders insertable" on public.orders;  -- 이제 place_order 로만 생성

create or replace function public.place_order(
  p_product_name text,
  p_amount bigint,
  p_qty integer default 1,
  p_request text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance bigint;
  v_order uuid;
  v_memo text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if coalesce(trim(p_product_name), '') = '' then
    raise exception 'product is required';
  end if;
  -- NOTE: 단가는 클라이언트 값입니다(단가표가 코드/시트에 있음). 관리자 화면에서
  -- 상품·수량 대비 금액을 확인하세요. 서버 단가표 도입 시 여기서 검증합니다.

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select coalesce((
    select balance_after from public.cash_transactions
    where user_id = v_uid order by created_at desc limit 1
  ), 0) into v_balance;

  if v_balance < p_amount then
    raise exception '캐시가 부족합니다';
  end if;

  insert into public.orders (user_id, product_name, amount_cash, qty, status, request)
  values (v_uid, trim(p_product_name), p_amount, greatest(coalesce(p_qty, 1), 1), 'received',
          nullif(left(trim(coalesce(p_request, '')), 1000), ''))
  returning id into v_order;

  v_memo := trim(p_product_name) || case when coalesce(p_qty, 1) > 1 then ' ×' || p_qty else '' end;
  insert into public.cash_transactions (user_id, type, amount, balance_after, memo)
  values (v_uid, 'use', -p_amount, v_balance - p_amount, v_memo);

  return v_order;
end;
$$;

revoke all on function public.place_order(text, bigint, integer, text) from public, anon;
grant execute on function public.place_order(text, bigint, integer, text) to authenticated;

-- 관리자 대시보드 ---------------------------------------------------------------
-- auth.users 와 다른 회원의 원장·주문은 RLS 로 막혀 있으므로, is_admin() 확인 후
-- 필요한 필드만 돌려주는 security definer RPC 로 제공합니다.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'members',         (select count(*) from auth.users),
      'ordersToday',     (select count(*) from public.orders where created_at >= v_today),
      'chargeCashToday', (select coalesce(sum(amount), 0) from public.cash_transactions
                           where type = 'charge' and created_at >= v_today),
      'pendingOrders',   (select count(*) from public.orders where status in ('received', 'in_progress'))
    ),
    'recentOrders', coalesce((
      select jsonb_agg(o order by o."createdAt" desc) from (
        select ord.id, u.email as "userEmail", ord.product_name as "productName",
               ord.amount_cash as "amountCash", ord.qty, ord.request, ord.status,
               ord.created_at as "createdAt"
        from public.orders ord
        left join auth.users u on u.id = ord.user_id
        order by ord.created_at desc
        limit 100
      ) o
    ), '[]'::jsonb),
    'recentCharges', coalesce((
      select jsonb_agg(c order by c."createdAt" desc) from (
        select t.id, u.email as "userEmail", t.amount as "amountCash", t.memo as method,
               t.created_at as "createdAt"
        from public.cash_transactions t
        left join auth.users u on u.id = t.user_id
        where t.type = 'charge'
        order by t.created_at desc
        limit 50
      ) c
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(m order by m."joinedAt" desc) from (
        select u.id, u.email,
               u.raw_app_meta_data ->> 'provider' as provider,
               coalesce((select t.balance_after from public.cash_transactions t
                         where t.user_id = u.id order by t.created_at desc limit 1), 0) as balance,
               u.created_at as "joinedAt",
               coalesce(nullif(u.raw_user_meta_data -> 'profile' ->> 'name', ''),
                        u.raw_user_meta_data ->> 'name',
                        u.raw_user_meta_data ->> 'full_name') as name,
               coalesce(nullif(u.raw_user_meta_data -> 'profile' ->> 'phone', ''),
                        u.raw_user_meta_data ->> 'phone_number',
                        u.raw_user_meta_data -> 'custom_claims' ->> 'phone_number') as phone,
               c.third_party as "thirdParty",
               c.marketing
        from auth.users u
        left join lateral (
          select l.third_party, l.marketing from public.consent_logs l
          where l.user_id = u.id order by l.created_at desc limit 1
        ) c on true
        order by u.created_at desc
        limit 500
      ) m
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- 주문 상태 변경. '취소'로 바꾸면 결제 캐시를 원장에 환불(type=refund)합니다.
-- 취소된 주문은 되돌릴 수 없습니다(되돌리면 환불이 중복될 수 있어서).
create or replace function public.admin_update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance bigint;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;
  if p_status not in ('received', 'in_progress', 'done', 'canceled') then
    raise exception '알 수 없는 상태입니다: %', p_status;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.';
  end if;
  if v_order.status = p_status then
    return;
  end if;
  if v_order.status = 'canceled' then
    raise exception '취소된 주문은 상태를 바꿀 수 없어요 (이미 환불됨).';
  end if;

  if p_status = 'canceled' then
    perform pg_advisory_xact_lock(hashtextextended(v_order.user_id::text, 0));
    select coalesce((
      select balance_after from public.cash_transactions
      where user_id = v_order.user_id order by created_at desc limit 1
    ), 0) into v_balance;
    insert into public.cash_transactions (user_id, type, amount, balance_after, memo)
    values (v_order.user_id, 'refund', v_order.amount_cash, v_balance + v_order.amount_cash,
            '주문 취소 환불: ' || v_order.product_name);
  end if;

  update public.orders set status = p_status where id = p_order_id;
end;
$$;

revoke all on function public.admin_update_order_status(uuid, text) from public, anon;
grant execute on function public.admin_update_order_status(uuid, text) to authenticated;

-- 원장 시각: now()는 트랜잭션 시작 시각으로 고정돼 같은 트랜잭션의 행이 동률이
-- 되고, "가장 최근 행 = 현재 잔액"이 모호해집니다. clock_timestamp()는 행마다 증가.
alter table public.cash_transactions alter column created_at set default clock_timestamp();
alter table public.orders alter column created_at set default clock_timestamp();

-- ============================================================================
-- ===== Free-calculator comment board =====================================
-- Separate from all calculator inputs (those never leave the browser).
-- Tables are closed to anon/authenticated; access only through the three
-- security-definer RPCs below, which validate input, rate-limit by a hashed
-- client IP (hash kept 1 day in a separate table, never on the comment) and
-- store the delete password as a bcrypt hash.

create table if not exists public.calc_comments (
  id uuid primary key default gen_random_uuid(),
  calc_slug text not null check (calc_slug ~ '^[a-z0-9-]{2,40}$'),
  parent_id uuid references public.calc_comments(id) on delete cascade,
  nickname text not null check (char_length(nickname) <= 20),
  password_hash text not null,
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);
create index if not exists calc_comments_slug_idx on public.calc_comments (calc_slug, created_at);
create index if not exists calc_comments_parent_idx on public.calc_comments (parent_id);
alter table public.calc_comments enable row level security;
revoke all on public.calc_comments from anon, authenticated;

create table if not exists public.calc_comment_hits (
  ip_hash text not null,
  kind text not null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists calc_comment_hits_idx on public.calc_comment_hits (ip_hash, kind, created_at);
alter table public.calc_comment_hits enable row level security;
revoke all on public.calc_comment_hits from anon, authenticated;

-- Hashed caller IP for rate limiting (raw IP is never stored).
create or replace function public.calc_comment_caller()
returns text language plpgsql stable security definer set search_path = '' as $$
declare h json; ip text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then h := null;
  end;
  ip := coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', btrim(split_part(h->>'x-forwarded-for', ',', 1)), 'unknown');
  return encode(extensions.digest(ip || ':calc-comments', 'sha256'), 'hex');
end $$;

-- Throttle: raise when the caller exceeded `max_hits` of `kind` in `win`.
create or replace function public.calc_comment_throttle(kind text, max_hits int, win interval)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare who text := public.calc_comment_caller();
begin
  delete from public.calc_comment_hits where created_at < now() - interval '1 day';
  if (select count(*) from public.calc_comment_hits c
      where c.ip_hash = who and c.kind = calc_comment_throttle.kind and c.created_at > now() - win) >= max_hits then
    raise exception 'rate_limited';
  end if;
  insert into public.calc_comment_hits (ip_hash, kind) values (who, calc_comment_throttle.kind);
end $$;

create or replace function public.calc_comment_list(p_slug text)
returns table (id uuid, parent_id uuid, nickname text, body text, created_at timestamptz, deleted boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.parent_id,
         case when c.deleted_at is null then c.nickname else '' end,
         case when c.deleted_at is null then c.body else '' end,
         c.created_at,
         c.deleted_at is not null
  from public.calc_comments c
  where c.calc_slug = p_slug
    -- deleted comments stay only as placeholders for their live replies
    and (c.deleted_at is null
         or exists (select 1 from public.calc_comments r where r.parent_id = c.id and r.deleted_at is null))
  order by c.created_at
  limit 500;
$$;

create or replace function public.calc_comment_add(
  p_slug text, p_parent uuid, p_nickname text, p_password text, p_body text,
  p_honeypot text default '', p_elapsed_ms int default 0
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_nick text := btrim(coalesce(p_nickname, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_parent public.calc_comments%rowtype;
  v_id uuid;
begin
  -- Bots: filled hidden field or submitted faster than a human could type.
  if coalesce(p_honeypot, '') <> '' or coalesce(p_elapsed_ms, 0) < 3000 then
    raise exception 'spam_detected';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9-]{2,40}$' then raise exception 'invalid_slug'; end if;
  if char_length(v_nick) < 1 or char_length(v_nick) > 20 or v_nick ~ '[[:cntrl:]<>]' then
    raise exception 'invalid_nickname';
  end if;
  if char_length(coalesce(p_password, '')) < 4 or char_length(p_password) > 30 then
    raise exception 'invalid_password';
  end if;
  if char_length(v_body) < 2 or char_length(v_body) > 1000 then raise exception 'invalid_body'; end if;
  if (char_length(v_body) - char_length(replace(lower(v_body), 'http', ''))) / 4 > 2 then
    raise exception 'too_many_links';
  end if;
  if p_parent is not null then
    select * into v_parent from public.calc_comments where id = p_parent;
    if not found or v_parent.calc_slug <> p_slug or v_parent.parent_id is not null or v_parent.deleted_at is not null then
      raise exception 'invalid_parent';
    end if;
  end if;
  if exists (select 1 from public.calc_comments c
             where c.calc_slug = p_slug and c.body = v_body and c.created_at > now() - interval '1 hour') then
    raise exception 'duplicate';
  end if;
  perform public.calc_comment_throttle('add', 5, interval '10 minutes');

  insert into public.calc_comments (calc_slug, parent_id, nickname, password_hash, body)
  values (p_slug, p_parent, v_nick, extensions.crypt(p_password, extensions.gen_salt('bf', 8)), v_body)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.calc_comment_delete(p_id uuid, p_password text)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_hash text;
begin
  perform public.calc_comment_throttle('delete', 10, interval '10 minutes');
  select password_hash into v_hash from public.calc_comments where id = p_id and deleted_at is null;
  if v_hash is null or extensions.crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    return false;
  end if;
  update public.calc_comments set deleted_at = now(), body = '', nickname = '' where id = p_id;
  return true;
end $$;

revoke all on function public.calc_comment_caller() from public, anon, authenticated;
revoke all on function public.calc_comment_throttle(text, int, interval) from public, anon, authenticated;
revoke all on function public.calc_comment_list(text) from public;
revoke all on function public.calc_comment_add(text, uuid, text, text, text, text, int) from public;
revoke all on function public.calc_comment_delete(uuid, text) from public;
grant execute on function public.calc_comment_list(text) to anon, authenticated;
grant execute on function public.calc_comment_add(text, uuid, text, text, text, text, int) to anon, authenticated;
grant execute on function public.calc_comment_delete(uuid, text) to anon, authenticated;
