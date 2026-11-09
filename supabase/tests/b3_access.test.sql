-- B3 access and behaviour tests. SCRATCH database only. Run after the shim, B1, B2, the B3-core migration
-- (supabase/migrations/20261106121130_*.sql) and supabase/drafts/b3_hardening.sql.
-- PRD refs: §8.2 (roles), §9.2 (audit_log), §10.1 (staff MFA, least privilege), AC-A1, AC-Q3.
-- Any failed check raises an error and stops the run.

create temp table t3_users (label text primary key, id uuid not null);
grant select on t3_users to public;
insert into t3_users select l, gen_random_uuid() from unnest(array['super','ops','content','safeguard','nobody']) l;
insert into auth.users (id, email) select id, label || '@b3test.invalid' from t3_users;
insert into public.user_roles (user_id, role)
select id, case label when 'super' then 'super_admin' when 'ops' then 'academy_admin'
  when 'content' then 'content_manager' when 'safeguard' then 'safeguarding_lead' end::public.app_role
from t3_users where label <> 'nobody';

-- Act as a role/user; `aal` is the sign-in assurance level (aal2 = finished multi-factor).
create function pg_temp.act_as(_role text, _label text default null, _aal text default 'aal2') returns void language plpgsql as $$
declare uid text := coalesce((select id::text from t3_users where label = _label), '');
begin
  perform set_config('request.jwt.claim.sub', uid, true);
  perform set_config('request.jwt.claims', json_build_object('sub', nullif(uid, ''), 'aal', _aal)::text, true);
  execute format('set local role %I', _role);
end $$;

-- Records created the way production creates them.
set role service_role;
select public.submit_enquiry('{"audience":"adult","name":"Ada B3","email":"ada@b3test.invalid","phone":"+256700000201","message":"Hello"}') as enq \gset
select public.submit_contact_message('{"topic":"other","name":"Mia B3","email":"mia@b3test.invalid","message":"Hi"}') as msg \gset
select public.submit_sponsor_enquiry('{"organization":"Acme","name":"Sam B3","email":"sam@b3test.invalid","interests":["other"],"message":"Hi"}') as spn \gset
select public.submit_equipment_pledge('{"name":"Pru B3","email":"pru@b3test.invalid","originCountry":"UK","shippingPlan":"undecided","items":[{"description":"Clubs","quantity":1,"condition":"good"}]}') as plg \gset
select public.submit_safeguarding_concern('{"message":"B3 safeguarding report"}') as sgd \gset
reset role;
create temp table t3_refs (k text primary key, v text not null);
grant select on t3_refs to public;
insert into t3_refs values ('enq', :'enq'), ('msg', :'msg'), ('spn', :'spn'), ('plg', :'plg'), ('sgd', :'sgd');

-- ================================================================================================
-- 1. Role helpers are private; a role only counts after multi-factor sign-in.
-- ================================================================================================
do $$
declare ops uuid := (select id from t3_users where label = 'ops');
begin
  if to_regprocedure('public.has_role(uuid,public.app_role)') is not null or to_regprocedure('public.is_ops_staff(uuid)') is not null then
    raise exception 'FAIL: role helpers are still in the public schema';
  end if;
  if has_schema_privilege('anon', 'private', 'usage') then raise exception 'FAIL: anon can use the private schema'; end if;
  if has_function_privilege('anon', 'private.has_role(uuid,public.app_role)', 'execute')
     or has_function_privilege('anon', 'private.is_ops_staff(uuid)', 'execute') then
    raise exception 'FAIL: anon can run the role helpers';
  end if;
  perform pg_temp.act_as('authenticated', 'ops', 'aal1');
  if private.has_role(ops, 'academy_admin') then raise exception 'FAIL: a role counted at aal1'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'ops', 'aal2');
  if not private.has_role(ops, 'academy_admin') or not private.is_ops_staff(ops) then raise exception 'FAIL: a role did not count at aal2'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 2. A password alone (aal1) reaches no records; finishing MFA (aal2) restores each role's access.
-- ================================================================================================
do $$
declare t text; n int; r text;
begin
  foreach r in array array['super','ops','safeguard'] loop
    perform pg_temp.act_as('authenticated', r, 'aal1');
    foreach t in array array['contact_person','enquiry','contact_message','sponsor_enquiry','equipment_pledge','equipment_pledge_item','email_log','audit_log'] loop
      execute format('select count(*) from public.%I', t) into n;
      if n <> 0 then raise exception 'FAIL: % at aal1 can read % rows of %', r, n, t; end if;
    end loop;
    update public.enquiry set status = 'contacted'; get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: % at aal1 changed enquiries', r; end if;
    -- A signed-in user may always read their own role row (the screens use it to explain a missing role).
    select count(*) into n from public.user_roles; if n <> 1 then raise exception 'FAIL: % at aal1 sees % role rows (expected only their own)', r, n; end if;
    reset role;
  end loop;
  -- No assurance claim at all is treated as not-MFA.
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', (select id::text from t3_users where label = 'ops'), true);
  set local role authenticated;
  select count(*) into n from public.enquiry; if n <> 0 then raise exception 'FAIL: no aal claim still reads enquiries'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'ops', 'aal2');
  select count(*) into n from public.enquiry; if n < 1 then raise exception 'FAIL: ops at aal2 cannot read enquiries'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'content', 'aal2');
  select count(*) into n from public.enquiry; if n <> 0 then raise exception 'FAIL: content manager reads enquiries'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 3. Notes work on every submission type and have a length limit.
-- ================================================================================================
do $$
declare t text; n int;
begin
  perform pg_temp.act_as('authenticated', 'ops');
  update public.enquiry set internal_notes = 'Called back' where reference = (select v from t3_refs where k = 'enq'); get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: enquiry notes'; end if;
  update public.contact_message set internal_notes = 'Replied' where reference = (select v from t3_refs where k = 'msg'); get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: message notes'; end if;
  update public.sponsor_enquiry set internal_notes = 'Meeting set' where reference = (select v from t3_refs where k = 'spn'); get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: sponsor notes'; end if;
  update public.equipment_pledge set internal_notes = 'Accepted' where reference = (select v from t3_refs where k = 'plg'); get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: pledge notes'; end if;
  foreach t in array array['enquiry','contact_message','sponsor_enquiry','equipment_pledge'] loop
    begin execute format('update public.%I set internal_notes = repeat(''x'', 4001)', t);
      raise exception 'FAIL: 4001-character note accepted on %', t;
    exception when check_violation then null; end;
  end loop;
  begin update public.contact_message set message = 'rewritten' where reference = (select v from t3_refs where k = 'msg');
    raise exception 'FAIL: sender message editable';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

-- ================================================================================================
-- 4. Audit log: written by the database, names the actor, never copies note text.
-- ================================================================================================
do $$
declare n int; a record; ops uuid := (select id from t3_users where label = 'ops');
begin
  -- Start clean without fighting the append-only rule (test setup only).
  set local session_replication_role = replica;
  delete from public.audit_log;
  set local session_replication_role = origin;

  perform pg_temp.act_as('authenticated', 'ops');
  update public.enquiry set status = 'contacted' where reference = (select v from t3_refs where k = 'enq');
  update public.enquiry set status = 'confirmed', internal_notes = 'Confidential note text 12345' where reference = (select v from t3_refs where k = 'enq');
  update public.enquiry set status = 'confirmed' where reference = (select v from t3_refs where k = 'enq'); -- no change: no new row
  update public.enquiry set owner_id = ops where reference = (select v from t3_refs where k = 'enq');
  reset role;

  select count(*) into n from public.audit_log where reference = (select v from t3_refs where k = 'enq');
  if n <> 4 then raise exception 'FAIL: expected 4 audit rows for the enquiry, got %', n; end if;
  select * into a from public.audit_log where reference = (select v from t3_refs where k = 'enq') and field = 'status' order by id limit 1;
  if a.actor_id <> ops or a.old_value <> 'new' or a.new_value <> 'contacted' or a.table_name <> 'enquiry' or a.is_safeguarding then
    raise exception 'FAIL: audit row wrong: %', to_jsonb(a);
  end if;
  if exists (select 1 from public.audit_log where to_jsonb(audit_log)::text like '%Confidential note text%') then
    raise exception 'FAIL: note text was copied into the audit log';
  end if;
  select * into a from public.audit_log where field = 'internal_notes' limit 1;
  if a.old_value is not null or a.new_value <> '(notes edited)' then raise exception 'FAIL: notes audit row wrong: %', to_jsonb(a); end if;

  -- Safeguarding workflow: lead and super admin can work a report; office staff cannot.
  perform pg_temp.act_as('authenticated', 'ops');
  update public.contact_message set status = 'closed' where reference = (select v from t3_refs where k = 'sgd'); get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: academy admin changed a safeguarding report'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'safeguard');
  update public.contact_message set status = 'replied', internal_notes = 'Escalated' where reference = (select v from t3_refs where k = 'sgd'); get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: safeguarding lead cannot work a safeguarding report'; end if;
  begin update public.contact_message set message = 'edited' where reference = (select v from t3_refs where k = 'sgd'); raise exception 'FAIL: report text editable';
  exception when insufficient_privilege then null; end;
  update public.enquiry set status = 'closed'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: safeguarding lead changed enquiries'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'super');
  update public.contact_message set status = 'closed' where reference = (select v from t3_refs where k = 'sgd'); get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: super admin cannot work a safeguarding report'; end if;
  reset role;
  if (select count(*) from public.audit_log where reference = (select v from t3_refs where k = 'sgd' ) and is_safeguarding) <> 3 then
    raise exception 'FAIL: safeguarding audit rows should be 3 and all marked safeguarding';
  end if;
  if exists (select 1 from public.audit_log where reference = (select v from t3_refs where k = 'sgd') and not is_safeguarding) then
    raise exception 'FAIL: a safeguarding audit row is not marked';
  end if;

  -- Who can read the log.
  perform pg_temp.act_as('authenticated', 'ops');
  select count(*) into n from public.audit_log where is_safeguarding; if n <> 0 then raise exception 'FAIL: academy admin reads safeguarding audit rows'; end if;
  select count(*) into n from public.audit_log where not is_safeguarding; if n < 4 then raise exception 'FAIL: academy admin cannot read the ordinary audit rows'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'content');
  select count(*) into n from public.audit_log; if n <> 0 then raise exception 'FAIL: content manager reads the audit log'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'safeguard');
  select count(*) into n from public.audit_log where is_safeguarding; if n <> 3 then raise exception 'FAIL: lead cannot read safeguarding audit rows'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'super');
  select count(*) into n from public.audit_log; if n < 7 then raise exception 'FAIL: super admin cannot read the whole log (%)', n; end if;
  reset role;
end $$;

-- ================================================================================================
-- 5. The audit log can only be read by staff and only appended to by the database itself.
-- ================================================================================================
do $$
declare p text;
begin
  -- Table privileges: the public holds none, signed-in users can only read.
  foreach p in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege('anon', 'public.audit_log', p) then raise exception 'FAIL: anon holds % on audit_log', p; end if;
    if p <> 'SELECT' and has_table_privilege('authenticated', 'public.audit_log', p) then raise exception 'FAIL: signed-in users hold % on audit_log', p; end if;
  end loop;
  if not has_table_privilege('authenticated', 'public.audit_log', 'SELECT') then raise exception 'FAIL: staff cannot read the audit log'; end if;

  perform pg_temp.act_as('authenticated', 'super');
  begin insert into public.audit_log (table_name, reference, field) values ('enquiry', 'X', 'status'); raise exception 'FAIL: staff can write audit rows';
  exception when insufficient_privilege then null; end;
  begin update public.audit_log set reference = 'hacked'; raise exception 'FAIL: staff can edit audit rows';
  exception when insufficient_privilege then null; end;
  begin delete from public.audit_log; raise exception 'FAIL: staff can delete audit rows';
  exception when insufficient_privilege then null; end;
  begin truncate public.audit_log; raise exception 'FAIL: staff can truncate the audit log';
  exception when insufficient_privilege then null; end;
  reset role;
  set local role service_role;
  begin update public.audit_log set reference = 'hacked'; raise exception 'FAIL: service_role can edit audit rows';
  exception when insufficient_privilege then null; end;
  begin delete from public.audit_log; raise exception 'FAIL: service_role can delete audit rows';
  exception when insufficient_privilege then null; end;
  begin truncate public.audit_log; raise exception 'FAIL: service_role can truncate the audit log';
  exception when insufficient_privilege then null; end;
  reset role;
  begin delete from public.audit_log; raise exception 'FAIL: the table owner can delete audit rows';
  exception when insufficient_privilege then null; end;
  begin truncate public.audit_log; raise exception 'FAIL: the table owner can truncate the audit log';
  exception when insufficient_privilege then null; end;
  begin insert into public.audit_log (table_name, reference, field) values ('enquiry', 'X', 'not_a_field'); raise exception 'FAIL: unknown audit field accepted';
  exception when check_violation then null; end;
end $$;

-- ================================================================================================
-- 6. Staff directory (names for the inbox): staff only, and only after MFA.
-- ================================================================================================
do $$
declare n int;
begin
  if has_function_privilege('anon', 'public.staff_directory()', 'execute') then raise exception 'FAIL: anon can list staff'; end if;
  perform pg_temp.act_as('authenticated', 'nobody');
  select count(*) into n from public.staff_directory(); if n <> 0 then raise exception 'FAIL: a user with no role can list staff'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'content');
  select count(*) into n from public.staff_directory(); if n <> 0 then raise exception 'FAIL: a content manager can list staff'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'ops', 'aal1');
  select count(*) into n from public.staff_directory(); if n <> 0 then raise exception 'FAIL: staff can list staff at aal1'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'ops', 'aal2');
  select count(*) into n from public.staff_directory() where email like '%@b3test.invalid'; if n <> 4 then raise exception 'FAIL: ops sees % staff, expected 4', n; end if;
  reset role;
end $$;

\echo 'ALL B3 ACCESS TESTS PASSED'
