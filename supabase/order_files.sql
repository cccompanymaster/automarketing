-- Order attachments (원고·사진 파일) and account credentials for products that
-- need a login (블로그 서로이웃 추가). Applied as migration "order_files_and_secrets".

alter table public.orders add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Private bucket: members upload into their own folder (<uid>/...), admins read all.
insert into storage.buckets (id, name, public, file_size_limit)
values ('order-files', 'order-files', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "order files: owner insert" on storage.objects;
create policy "order files: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'order-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "order files: owner or admin read" on storage.objects;
create policy "order files: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'order-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "order files: owner delete" on storage.objects;
create policy "order files: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'order-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Credentials live apart from the order text (never in request, email or
-- analytics), are readable only through an admin RPC, and are deleted as soon
-- as the order is done or canceled.
create table if not exists public.order_secrets (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null,
  secret text not null,
  created_at timestamptz not null default now()
);
alter table public.order_secrets enable row level security;
revoke all on public.order_secrets from anon, authenticated;

create or replace function public.place_order_v2(
  p_product_name text, p_amount bigint, p_qty integer, p_request text, p_client_key uuid,
  p_files jsonb default '[]'::jsonb, p_secret text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order uuid;
  v_files jsonb := coalesce(p_files, '[]'::jsonb);
  v_f jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if jsonb_typeof(v_files) <> 'array' or jsonb_array_length(v_files) > 20 then raise exception 'bad_files'; end if;
  for v_f in select * from jsonb_array_elements(v_files) loop
    if coalesce(v_f->>'path', '') not like v_uid::text || '/%'
       or not exists (select 1 from storage.objects o where o.bucket_id = 'order-files' and o.name = v_f->>'path') then
      raise exception 'bad_files';
    end if;
  end loop;
  if p_secret is not null and char_length(p_secret) > 200 then raise exception 'bad_secret'; end if;

  v_order := public.place_order(p_product_name, p_amount, p_qty, p_request, p_client_key);

  -- A retry with the same key returns the existing order; attach only once.
  update public.orders set attachments = (
      select coalesce(jsonb_agg(jsonb_build_object('path', f->>'path', 'name', left(coalesce(f->>'name', ''), 200),
                                                   'size', coalesce((f->>'size')::bigint, 0))), '[]'::jsonb)
      from jsonb_array_elements(v_files) f)
    where id = v_order and attachments = '[]'::jsonb and jsonb_array_length(v_files) > 0;
  if nullif(btrim(coalesce(p_secret, '')), '') is not null then
    insert into public.order_secrets (order_id, user_id, secret) values (v_order, v_uid, p_secret)
    on conflict (order_id) do nothing;
  end if;
  return v_order;
end $$;
revoke all on function public.place_order_v2(text, bigint, integer, text, uuid, jsonb, text) from public, anon;
grant execute on function public.place_order_v2(text, bigint, integer, text, uuid, jsonb, text) to authenticated;

create or replace function public.admin_order_secret(p_order_id uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return (select secret from public.order_secrets where order_id = p_order_id);
end $$;
revoke all on function public.admin_order_secret(uuid) from public, anon;
grant execute on function public.admin_order_secret(uuid) to authenticated;

create or replace function public.purge_order_secret() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('done', 'canceled') then
    delete from public.order_secrets where order_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists orders_purge_secret on public.orders;
create trigger orders_purge_secret after update of status on public.orders
  for each row execute function public.purge_order_secret();

-- admin_overview additionally returns ord.attachments and
--   exists (select 1 from public.order_secrets s where s.order_id = ord.id) as "hasSecret"
-- in recentOrders (see the applied migration for the full function).
