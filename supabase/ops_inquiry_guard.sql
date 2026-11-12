-- Patch the existing function in place. Preserve owner, grants, arguments, logging,
-- notification hooks and any deployment-only behavior. Refuse unexpected source.
begin;
do $migration$
declare
  f regprocedure := 'public.submit_inquiry(text,text,text,text,text,text,text)'::regprocedure;
  definition text := pg_get_functiondef(f);
  before_guard text := $before$if (select count(*) from public.inquiries where contact = v_contact and created_at > now() - interval '10 minutes') >= 5 then$before$;
  after_guard text := $after$v_key := case when v_contact ~ '^[0-9+(). -]+$' then regexp_replace(v_contact, '[^0-9]', '', 'g') else lower(btrim(v_contact)) end;
  if length(v_key) < 4 then raise exception 'invalid_contact'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 117));
  if (select count(*) from public.inquiries where (case when contact ~ '^[0-9+(). -]+$' then regexp_replace(contact, '[^0-9]', '', 'g') else lower(btrim(contact)) end) = v_key and created_at > now() - interval '10 minutes') >= 5 then$after$;
begin
  if strpos(definition, after_guard)>0 then return; end if;
  if array_length(string_to_array(definition, before_guard),1) <> 2
     or array_length(string_to_array(definition,'v_code text;'),1) <> 2 then
    raise exception 'Unknown inquiry function; review before migration';
  end if;
  definition := replace(definition, 'v_code text;', E'v_code text;\n  v_key text;');
  execute replace(definition,before_guard,after_guard);
end $migration$;
commit;
