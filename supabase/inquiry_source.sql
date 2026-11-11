-- Inquiry traffic source (ads / search / AI answer), sent by the site from src/lib/attribution.ts.
-- Run once in Supabase → SQL Editor. Safe on a live site: the deployed client falls back to the
-- 6-argument call until this exists, and after it exists 6-argument calls still work (p_source defaults to null).

alter table public.inquiries add column if not exists source text;

-- Replaced (not overloaded) so 6-argument calls keep resolving to one function.
drop function if exists public.submit_inquiry(text, text, text, text, text, text);
create function public.submit_inquiry(p_name text, p_contact text, p_email text, p_topic text, p_message text,
                                      p_page text default null, p_source text default null)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_code text;
  v_name text := btrim(coalesce(p_name, ''));
  v_contact text := btrim(coalesce(p_contact, ''));
  v_message text := btrim(coalesce(p_message, ''));
begin
  if char_length(v_name) < 1 or char_length(v_name) > 40 then raise exception 'invalid_name'; end if;
  if char_length(v_contact) < 4 or char_length(v_contact) > 60 then raise exception 'invalid_contact'; end if;
  if char_length(v_message) < 2 or char_length(v_message) > 2000 then raise exception 'invalid_message'; end if;
  -- Light flood guard: same contact at most 5 times in 10 minutes.
  if (select count(*) from public.inquiries where contact = v_contact and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'too_many';
  end if;
  loop
    v_code := 'Q' || to_char(now() at time zone 'Asia/Seoul', 'MMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4));
    exit when not exists (select 1 from public.inquiries where code = v_code);
  end loop;
  insert into public.inquiries (code, user_id, name, contact, email, topic, message, page, source)
  values (v_code, auth.uid(), v_name, v_contact, nullif(btrim(coalesce(p_email, '')), ''),
          left(btrim(coalesce(p_topic, '문의')), 120), v_message, left(p_page, 300),
          nullif(left(btrim(coalesce(p_source, '')), 480), ''));
  return v_code;
end $function$;

revoke all on function public.submit_inquiry(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text, text, text, text) to anon, authenticated, service_role;

create or replace function public.admin_inquiries()
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(x order by x."createdAt" desc) from (
      select i.id, i.code, i.name, i.contact, i.email, i.topic, i.message, i.page, i.source, i.status,
             i.created_at as "createdAt"
      from public.inquiries i
      where i.created_at > now() - interval '120 days'
      order by i.created_at desc limit 300
    ) x
  ), '[]'::jsonb);
end $function$;
