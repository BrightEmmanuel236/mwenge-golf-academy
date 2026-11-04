-- B1 access and behaviour tests. Run on a SCRATCH database only (never on real data):
--   psql -v ON_ERROR_STOP=1 -d scratch -f supabase/tests/supabase-shim.sql      (once; imitates Supabase roles)
--   psql -v ON_ERROR_STOP=1 -d scratch -f supabase/drafts/b1_public_forms.sql   (or the applied migration)
--   psql -v ON_ERROR_STOP=1 -d scratch -f supabase/tests/b1_access.test.sql
-- Any failed check raises an error and stops the run. PRD refs: 8.2, 9.3, 10.1, AC-A1, AC-E2, AC-Q3.

-- ---- fixtures: one user per role, plus a user with no role --------------------------------------
create temp table t_users (label text primary key, id uuid not null);
grant select on t_users to public;
insert into t_users select l, gen_random_uuid() from unnest(array['super','ops','content','safeguard','nobody']) l;
insert into auth.users (id, email) select id, label || '@test.invalid' from t_users;
insert into public.user_roles (user_id, role)
select id, case label when 'super' then 'super_admin' when 'ops' then 'academy_admin'
  when 'content' then 'content_manager' when 'safeguard' then 'safeguarding_lead' end::public.app_role
from t_users where label <> 'nobody';

-- Records created the way production creates them: through the server functions, as service_role.
set role service_role;
select public.submit_enquiry('{"audience":"adult","name":"Ada Test","email":"ada@test.invalid","phone":"+256700000001","message":"Hello"}');
select public.submit_contact_message('{"topic":"training","name":"Ada Test","email":"ada@test.invalid","message":"Hi"}');
select public.submit_sponsor_enquiry('{"organization":"Acme","name":"Bo","email":"bo@test.invalid","interests":["event-sponsorship"],"message":"Hi"}');
select public.submit_equipment_pledge('{"name":"Cy","email":"cy@test.invalid","originCountry":"UK","shippingPlan":"undecided","items":[{"description":"Clubs","quantity":3,"condition":"good"}]}');
reset role;
-- A safeguarding message cannot be created through the function (see below); insert one directly as
-- the table owner so the visibility rules can still be checked.
insert into public.contact_message (reference, contact_person_id, submitted_name, topic, message)
select 'MGA-MSG-TEST-SG', id, 'Concerned Person', 'safeguarding', 'test concern' from public.contact_person limit 1;

-- Helper: run as a role/user. `uid` may be null for anon.
create function pg_temp.act_as(_role text, _label text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce((select id::text from t_users where label = _label), ''), true);
  execute format('set local role %I', _role);
end $$;

-- ================================================================================================
-- 1. The public (anon) can do nothing directly: not read, write, truncate, or call server functions.
-- ================================================================================================
do $$
declare t text; n int;
begin
  perform pg_temp.act_as('anon');
  foreach t in array array['user_roles','contact_person','enquiry','contact_message','sponsor_enquiry',
    'equipment_pledge','equipment_pledge_item','reference_counter','submission_throttle'] loop
    begin execute format('select count(*) from public.%I', t) into n;
      raise exception 'FAIL: anon can read %', t;
    exception when insufficient_privilege then null; end;
    begin execute format('insert into public.%I default values', t);
      raise exception 'FAIL: anon can insert into %', t;
    exception when insufficient_privilege then null; when not_null_violation or check_violation then
      raise exception 'FAIL: anon insert into % reached constraint checks (privilege not denied)', t; end;
    begin execute format('truncate public.%I', t);
      raise exception 'FAIL: anon can truncate %', t;
    exception when insufficient_privilege then null; end;
  end loop;
  foreach t in array array['submit_enquiry(jsonb)','submit_contact_message(jsonb)','submit_sponsor_enquiry(jsonb)',
    'submit_equipment_pledge(jsonb)','check_and_record_throttle(text,text)','next_reference(text)',
    'ensure_contact(text,text,text,text)','has_role(uuid,public.app_role)','is_ops_staff(uuid)'] loop
    if has_function_privilege('anon', 'public.' || t, 'execute') or has_function_privilege('authenticated', 'public.' || t, 'execute') and t not in ('has_role(uuid,public.app_role)','is_ops_staff(uuid)') then
      raise exception 'FAIL: public roles can execute %', t;
    end if;
  end loop;
  reset role;
end $$;

-- ================================================================================================
-- 2. A signed-in user with no staff role sees nothing and changes nothing.
-- ================================================================================================
do $$
declare t text; n int;
begin
  perform pg_temp.act_as('authenticated', 'nobody');
  foreach t in array array['contact_person','enquiry','contact_message','sponsor_enquiry','equipment_pledge','equipment_pledge_item'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then raise exception 'FAIL: roleless user sees % rows in %', n, t; end if;
  end loop;
  update public.enquiry set status = 'closed'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: roleless user updated % enquiries', n; end if;
  reset role;
end $$;

-- ================================================================================================
-- 3. Role matrix (PRD 8.2).
-- ================================================================================================
do $$
declare n int;
begin
  -- Content Manager: no enquiries, messages, sponsors, pledges, or contacts.
  perform pg_temp.act_as('authenticated', 'content');
  select count(*) into n from public.enquiry; if n <> 0 then raise exception 'FAIL: content manager sees enquiries'; end if;
  select count(*) into n from public.contact_message; if n <> 0 then raise exception 'FAIL: content manager sees messages'; end if;
  select count(*) into n from public.contact_person; if n <> 0 then raise exception 'FAIL: content manager sees contacts'; end if;
  select count(*) into n from public.sponsor_enquiry; if n <> 0 then raise exception 'FAIL: content manager sees sponsors'; end if;
  select count(*) into n from public.equipment_pledge; if n <> 0 then raise exception 'FAIL: content manager sees pledges'; end if;
  reset role;

  -- Academy Admin: reads and works submissions, but NOT safeguarding messages.
  perform pg_temp.act_as('authenticated', 'ops');
  select count(*) into n from public.enquiry; if n < 1 then raise exception 'FAIL: ops cannot read enquiries'; end if;
  select count(*) into n from public.contact_message where topic = 'safeguarding';
  if n <> 0 then raise exception 'FAIL: academy admin can read safeguarding messages'; end if;
  select count(*) into n from public.contact_message where topic <> 'safeguarding';
  if n < 1 then raise exception 'FAIL: ops cannot read ordinary messages'; end if;
  update public.enquiry set status = 'contacted'; get diagnostics n = row_count;
  if n < 1 then raise exception 'FAIL: ops cannot update enquiry status'; end if;
  begin update public.enquiry set reference = 'MGA-ENQ-HACKED'; raise exception 'FAIL: reference was editable';
  exception when insufficient_privilege then null; end;
  begin update public.enquiry set message = 'rewritten'; raise exception 'FAIL: sender message was editable';
  exception when insufficient_privilege then null; end;
  begin delete from public.enquiry; raise exception 'FAIL: ops can delete enquiries';
  exception when insufficient_privilege then null; end;
  begin insert into public.enquiry (reference, contact_person_id, audience, submitted_name, submitted_phone, message)
    select 'X', id, 'adult', 'x', 'x', 'x' from public.contact_person limit 1; raise exception 'FAIL: ops can insert enquiries directly';
  exception when insufficient_privilege then null; end;
  begin insert into public.user_roles (user_id, role) select id, 'super_admin' from t_users where label = 'ops';
    raise exception 'FAIL: staff can grant themselves roles';
  exception when insufficient_privilege then null; end;
  reset role;

  -- Safeguarding Lead: reads everything relevant including safeguarding messages, changes nothing.
  perform pg_temp.act_as('authenticated', 'safeguard');
  select count(*) into n from public.contact_message where topic = 'safeguarding';
  if n <> 1 then raise exception 'FAIL: safeguarding lead cannot read safeguarding messages'; end if;
  select count(*) into n from public.enquiry; if n < 1 then raise exception 'FAIL: safeguarding lead cannot read enquiries'; end if;
  update public.enquiry set status = 'closed'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: safeguarding lead updated enquiries'; end if;
  reset role;

  -- Super Admin: reads safeguarding messages (AC-Q3 names Super Administrator).
  perform pg_temp.act_as('authenticated', 'super');
  select count(*) into n from public.contact_message where topic = 'safeguarding';
  if n <> 1 then raise exception 'FAIL: super admin cannot read safeguarding messages'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 4. Server functions (service_role): rules the database enforces on its own.
-- ================================================================================================
do $$
declare ref1 text; ref2 text; ok boolean; n int; cid uuid; opt boolean;
begin
  set local role service_role;
  -- AC-E2: a junior enquiry needs guardian details and the declaration.
  begin perform public.submit_enquiry('{"audience":"junior","name":"P","email":"p@test.invalid","phone":"+256700000002","message":"m"}');
    raise exception 'FAIL: junior enquiry accepted without guardian details';
  exception when check_violation then null; end;
  begin perform public.submit_enquiry('{"audience":"junior","name":"P","email":"p@test.invalid","phone":"+256700000002","message":"m","guardianRelationship":"Parent","childFirstName":"Kid","childAge":3,"guardianDeclaration":true}');
    raise exception 'FAIL: child aged 3 accepted';
  exception when check_violation then null; end;
  begin perform public.submit_enquiry('{"audience":"corporate","name":"P","email":"p@test.invalid","phone":"+256700000002","message":"m"}');
    raise exception 'FAIL: corporate enquiry accepted without an organization';
  exception when check_violation then null; end;
  perform public.submit_enquiry('{"audience":"junior","name":"P","email":"p@test.invalid","phone":"+256700000002","message":"m","guardianRelationship":"Parent","childFirstName":"Kid","childAge":9,"guardianDeclaration":true}');

  -- A failed submission leaves no record behind (AC-E3).
  select count(*) into n from public.enquiry where submitted_name = 'P'; if n <> 1 then raise exception 'FAIL: failed submissions left rows (% for P)', n; end if;

  -- W10 / amendment 2: safeguarding intake refused for now.
  begin perform public.submit_contact_message('{"topic":"safeguarding","name":"S","email":"s@test.invalid","message":"m"}');
    raise exception 'FAIL: safeguarding message accepted';
  exception when raise_exception then if sqlerrm <> 'safeguarding_intake_disabled' then raise; end if; end;

  -- A pledge needs at least one item.
  begin perform public.submit_equipment_pledge('{"name":"C","email":"c@test.invalid","originCountry":"UK","shippingPlan":"undecided","items":[]}');
    raise exception 'FAIL: pledge without items accepted';
  exception when raise_exception then if sqlerrm <> 'pledge_needs_items' then raise; end if; end;

  -- Amendment 3: an existing contact is never overwritten, and marketing opt-in is not changed.
  perform public.submit_contact_message('{"topic":"other","name":"Someone Else","phone":"+256799999999","email":"ADA@test.invalid","message":"second"}');
  select id, marketing_opt_in into cid, opt from public.contact_person where email = 'ada@test.invalid';
  if (select name from public.contact_person where id = cid) <> 'Ada Test' then raise exception 'FAIL: contact name overwritten'; end if;
  if (select phone from public.contact_person where id = cid) is distinct from '+256700000001' then raise exception 'FAIL: contact phone overwritten'; end if;
  if opt then raise exception 'FAIL: marketing opt-in turned on by a public submission'; end if;
  if (select count(*) from public.contact_person where email = 'ada@test.invalid') <> 1 then raise exception 'FAIL: duplicate contact created'; end if;
  -- ...while what the sender typed is kept on the submission itself.
  if (select submitted_name from public.contact_message where message = 'second') <> 'Someone Else' then raise exception 'FAIL: sender snapshot missing'; end if;

  -- References: format, uniqueness, per-type counters.
  ref1 := public.submit_sponsor_enquiry('{"organization":"A","name":"N","email":"n1@test.invalid","interests":["other"],"message":"m"}');
  ref2 := public.submit_sponsor_enquiry('{"organization":"B","name":"N","email":"n2@test.invalid","interests":["other"],"message":"m"}');
  if ref1 !~ '^MGA-SPN-20[0-9]{2}-[0-9]{4}$' then raise exception 'FAIL: bad reference format %', ref1; end if;
  if ref1 = ref2 then raise exception 'FAIL: duplicate references'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 5. Throttle (amendment 4): 5 per email, 30 per IP per 10 minutes; hashes only; 24h purge.
-- ================================================================================================
do $$
declare i int; ok boolean; eh text := repeat('a', 64); ih text := repeat('b', 64);
begin
  set local role service_role;
  for i in 1..5 loop
    if not public.check_and_record_throttle(eh, ih) then raise exception 'FAIL: attempt % blocked too early', i; end if;
  end loop;
  if public.check_and_record_throttle(eh, ih) then raise exception 'FAIL: 6th attempt for one email was allowed'; end if;
  -- A different email from the same IP is still fine (shared networks), until the IP limit.
  for i in 1..25 loop
    if not public.check_and_record_throttle(md5(i::text) || md5(i::text), ih) then raise exception 'FAIL: IP blocked early at %', i; end if;
  end loop;
  if public.check_and_record_throttle(repeat('c', 64), ih) then raise exception 'FAIL: 31st attempt from one IP was allowed'; end if;
  reset role;
  -- Keys must be 64-char hashes: a raw email or IP cannot be stored.
  begin insert into public.submission_throttle (key_kind, key_hash) values ('email', 'someone@example.com');
    raise exception 'FAIL: raw value stored in throttle';
  exception when check_violation then null; end;
  -- Rows older than 24h are purged on the next check.
  insert into public.submission_throttle (key_kind, key_hash, created_at) values ('ip', repeat('d', 64), now() - interval '25 hours');
  set local role service_role;
  perform public.check_and_record_throttle(repeat('e', 64), repeat('f', 64));
  reset role;
  if exists (select 1 from public.submission_throttle where key_hash = repeat('d', 64)) then raise exception 'FAIL: old throttle rows not purged'; end if;
end $$;

\echo 'ALL B1 ACCESS TESTS PASSED'
