-- B2 access and behaviour tests. SCRATCH database only. Run after the shim, b1_public_forms.sql and
-- b2_email_and_safeguarding.sql. Any failed check raises an error and stops the run.
-- PRD refs: AC-E1, AC-Q2, AC-Q3, W10, §9.2 (email_log), §10.2, §11.4.

create temp table t2_users (label text primary key, id uuid not null);
grant select on t2_users to public;
insert into t2_users select l, gen_random_uuid() from unnest(array['super','ops','content','safeguard']) l;
insert into auth.users (id, email) select id, label || '@b2test.invalid' from t2_users;
insert into public.user_roles (user_id, role)
select id, case label when 'super' then 'super_admin' when 'ops' then 'academy_admin'
  when 'content' then 'content_manager' when 'safeguard' then 'safeguarding_lead' end::public.app_role
from t2_users;

create function pg_temp.act_as(_role text, _label text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce((select id::text from t2_users where label = _label), ''), true);
  execute format('set local role %I', _role);
end $$;

-- Records created the way production creates them.
set role service_role;
select public.submit_enquiry('{"audience":"junior","name":"Pat Parent","email":"pat@b2test.invalid","phone":"+256700000101","message":"Please enrol my child","guardianRelationship":"Mother","childFirstName":"Kai","childAge":9,"guardianDeclaration":true,"programSlug":"junior-academy"}') as enq \gset
select public.submit_contact_message('{"topic":"media","name":"Mia Media","email":"mia@b2test.invalid","phone":"+256700000102","message":"Press question"}') as msg \gset
select public.submit_sponsor_enquiry('{"organization":"Acme","name":"Sam Sponsor","email":"sam@b2test.invalid","interests":["event-sponsorship","other"],"message":"We can help"}') as spn \gset
select public.submit_equipment_pledge('{"name":"Pru Pledge","email":"pru@b2test.invalid","originCountry":"Kenya","shippingPlan":"donor-ships","notes":"Boxed","items":[{"description":"Irons","quantity":4,"condition":"good"},{"description":"Balls","quantity":50,"condition":"new"}]}') as plg \gset
select count(*) as people_before from public.contact_person \gset
select public.submit_safeguarding_concern('{"name":"Worried Person","email":"Worried@B2Test.invalid","phone":"+256700000103","message":"I am concerned about something"}') as sgd \gset
select public.submit_safeguarding_concern('{"message":"Anonymous concern text"}') as sgd_anon \gset
reset role;
-- psql variables are not expanded inside DO blocks, so pass the references through a table.
create temp table t2_refs (k text primary key, v text not null);
grant select on t2_refs to public;
insert into t2_refs values ('enq', :'enq'), ('msg', :'msg'), ('spn', :'spn'), ('plg', :'plg'),
  ('sgd', :'sgd'), ('sgd_anon', :'sgd_anon'), ('people_before', :'people_before');

-- ================================================================================================
-- 1. Nothing here is reachable by the public or by signed-in users directly.
-- ================================================================================================
do $$
declare f text;
begin
  perform pg_temp.act_as('anon');
  begin perform count(*) from public.email_log; raise exception 'FAIL: anon can read email_log';
  exception when insufficient_privilege then null; end;
  begin truncate public.email_log; raise exception 'FAIL: anon can truncate email_log';
  exception when insufficient_privilege then null; end;
  reset role;
  foreach f in array array['claim_email(text,text,text)','finish_email(text,text,boolean,text,text)',
    'list_emails_to_retry(integer)','get_submission_for_email(text)','submit_safeguarding_concern(jsonb)'] loop
    if has_function_privilege('anon', 'public.' || f, 'execute') or has_function_privilege('authenticated', 'public.' || f, 'execute') then
      raise exception 'FAIL: public or signed-in roles can execute %', f;
    end if;
    if not has_function_privilege('service_role', 'public.' || f, 'execute') then
      raise exception 'FAIL: service_role cannot execute %', f;
    end if;
  end loop;
  -- Privacy by design: the log has no column that could hold an address or message text.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'email_log'
             and column_name in ('email', 'to', 'recipient', 'address', 'body', 'message', 'subject')) then
    raise exception 'FAIL: email_log has a column that could hold personal data';
  end if;
end $$;

-- ================================================================================================
-- 2. Safeguarding intake (W10, AC-Q3).
-- ================================================================================================
do $$
declare n int; m record;
begin
  if (select v from t2_refs where k = 'sgd') !~ '^MGA-SGD-20[0-9]{2}-[0-9]{4}$' then raise exception 'FAIL: bad safeguarding reference %', (select v from t2_refs where k = 'sgd'); end if;
  -- No general contact record is created (it would be visible to office staff).
  select count(*) into n from public.contact_person;
  if n <> (select v::int from t2_refs where k = 'people_before') then raise exception 'FAIL: safeguarding report created a contact record'; end if;
  select * into m from public.contact_message where reference = (select v from t2_refs where k = 'sgd');
  if m.topic <> 'safeguarding' or m.contact_person_id is not null then raise exception 'FAIL: wrong safeguarding row'; end if;
  if m.submitted_email <> 'worried@b2test.invalid' then raise exception 'FAIL: reporter email not kept (lower-cased) on the restricted row'; end if;
  select * into m from public.contact_message where reference = (select v from t2_refs where k = 'sgd_anon');
  if m.submitted_name <> 'Anonymous' or m.submitted_email is not null then raise exception 'FAIL: anonymous report mishandled'; end if;

  -- The general contact path still cannot carry a safeguarding concern.
  set local role service_role;
  begin perform public.submit_contact_message('{"topic":"safeguarding","name":"S","email":"s@b2test.invalid","message":"m"}');
    raise exception 'FAIL: general contact function accepted a safeguarding concern';
  exception when raise_exception then if sqlerrm <> 'safeguarding_intake_disabled' then raise; end if; end;
  reset role;
  -- A non-safeguarding message must still have a contact person.
  begin insert into public.contact_message (reference, contact_person_id, submitted_name, topic, message)
    values ('MGA-MSG-X', null, 'x', 'other', 'x'); raise exception 'FAIL: ordinary message accepted without a contact';
  exception when check_violation then null; end;

  -- Who can read it: lead and super admin only.
  perform pg_temp.act_as('authenticated', 'ops');
  select count(*) into n from public.contact_message where topic = 'safeguarding';
  if n <> 0 then raise exception 'FAIL: academy admin can read safeguarding reports'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'content');
  select count(*) into n from public.contact_message; if n <> 0 then raise exception 'FAIL: content manager reads messages'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'safeguard');
  select count(*) into n from public.contact_message where reference in ((select v from t2_refs where k = 'sgd'), (select v from t2_refs where k = 'sgd_anon')); if n <> 2 then raise exception 'FAIL: lead sees % reports', n; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'super');
  select count(*) into n from public.contact_message where reference in ((select v from t2_refs where k = 'sgd'), (select v from t2_refs where k = 'sgd_anon')); if n <> 2 then raise exception 'FAIL: super admin sees % reports', n; end if;
  reset role;
end $$;

-- ================================================================================================
-- 3. What an email may contain.
-- ================================================================================================
do $$
declare r jsonb;
begin
  set local role service_role;
  r := public.get_submission_for_email((select v from t2_refs where k = 'enq'));
  if r->>'kind' <> 'enquiry' or r->>'email' <> 'pat@b2test.invalid' or (r->>'is_junior')::boolean is not true then raise exception 'FAIL: enquiry data wrong: %', r; end if;
  if r ? 'child_first_name' or r ? 'child_age' or r ? 'guardian_declaration' or r::text ilike '%Kai%' then
    raise exception 'FAIL: child details leaked into email data: %', r;
  end if;
  if r->>'guardian_relationship' <> 'Mother' or r->>'program_slug' <> 'junior-academy' then raise exception 'FAIL: guardian/program missing'; end if;

  r := public.get_submission_for_email((select v from t2_refs where k = 'msg'));
  if r->>'kind' <> 'contact' or r->>'topic' <> 'media' or r->>'email' <> 'mia@b2test.invalid' then raise exception 'FAIL: contact data wrong'; end if;
  r := public.get_submission_for_email((select v from t2_refs where k = 'spn'));
  if r->>'kind' <> 'sponsor' or jsonb_array_length(r->'interests') <> 2 then raise exception 'FAIL: sponsor data wrong'; end if;
  r := public.get_submission_for_email((select v from t2_refs where k = 'plg'));
  if r->>'kind' <> 'pledge' or jsonb_array_length(r->'items') <> 2 or (r->'items'->0->>'description') <> 'Irons' then raise exception 'FAIL: pledge data wrong: %', r; end if;
  r := public.get_submission_for_email((select v from t2_refs where k = 'sgd'));
  if r->>'kind' <> 'safeguarding' or r->>'message' <> 'I am concerned about something' then raise exception 'FAIL: safeguarding data wrong'; end if;
  -- A safeguarding reference can never be read through the ordinary contact reference path.
  if public.get_submission_for_email('MGA-MSG-9999-9999') is not null then raise exception 'FAIL: unknown reference returned data'; end if;
  if public.get_submission_for_email('nonsense') is not null then raise exception 'FAIL: nonsense reference returned data'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 4. Claiming and finishing emails (never twice, retry, 5 tries, setup problems are free).
-- ================================================================================================
do $$
declare i int; ok boolean;
begin
  set local role service_role;
  if not public.claim_email((select v from t2_refs where k = 'enq'), 'staff_notification', 'staff') then raise exception 'FAIL: first claim refused'; end if;
  if public.claim_email((select v from t2_refs where k = 'enq'), 'staff_notification', 'staff') then raise exception 'FAIL: two callers could send the same email at once'; end if;
  perform public.finish_email((select v from t2_refs where k = 'enq'), 'staff_notification', true, 'prov-1', null);
  if public.claim_email((select v from t2_refs where k = 'enq'), 'staff_notification', 'staff') then raise exception 'FAIL: an email already sent could be sent again'; end if;
  if (select status from public.email_log where reference = (select v from t2_refs where k = 'enq') and template = 'staff_notification') <> 'sent' then raise exception 'FAIL: not marked sent'; end if;

  -- Failure: can be claimed again, up to 5 tries.
  perform public.claim_email((select v from t2_refs where k = 'msg'), 'staff_notification', 'staff');
  for i in 1..4 loop
    perform public.finish_email((select v from t2_refs where k = 'msg'), 'staff_notification', false, null, 'http_500');
    if not public.claim_email((select v from t2_refs where k = 'msg'), 'staff_notification', 'staff') then raise exception 'FAIL: retry % refused', i; end if;
  end loop;
  perform public.finish_email((select v from t2_refs where k = 'msg'), 'staff_notification', false, null, 'http_500');
  if public.claim_email((select v from t2_refs where k = 'msg'), 'staff_notification', 'staff') then raise exception 'FAIL: sixth attempt allowed'; end if;

  -- Setup problems do not use up tries.
  perform public.claim_email((select v from t2_refs where k = 'spn'), 'sender_confirmation', 'sender');
  for i in 1..12 loop
    perform public.finish_email((select v from t2_refs where k = 'spn'), 'sender_confirmation', false, null, 'not_configured');
    if not public.claim_email((select v from t2_refs where k = 'spn'), 'sender_confirmation', 'sender') then raise exception 'FAIL: setup problem used up the tries at %', i; end if;
  end loop;

  -- A claim that never finished (crash) becomes claimable after 5 minutes, not before.
  perform public.claim_email((select v from t2_refs where k = 'plg'), 'staff_notification', 'staff');
  if public.claim_email((select v from t2_refs where k = 'plg'), 'staff_notification', 'staff') then raise exception 'FAIL: fresh pending claim was re-claimable'; end if;
  reset role;
  -- Backdate the claim without the updated_at trigger overwriting it (test setup only).
  set local session_replication_role = replica;
  update public.email_log set updated_at = now() - interval '6 minutes' where reference = (select v from t2_refs where k = 'plg');
  set local session_replication_role = origin;
  set local role service_role;
  if not public.claim_email((select v from t2_refs where k = 'plg'), 'staff_notification', 'staff') then raise exception 'FAIL: stuck claim not recoverable'; end if;
  reset role;
end $$;

-- ================================================================================================
-- 5. The retry list.
-- ================================================================================================
do $$
declare r jsonb;
begin
  -- Make known states: one failed 3 min ago, one failed just now, one stuck pending, one exhausted.
  delete from public.email_log;
  insert into public.email_log (reference, template, recipient_kind, status, attempts, updated_at) values
    ('R-FAILED-OLD', 'staff_notification', 'staff', 'failed', 1, now() - interval '3 minutes'),
    ('R-FAILED-NEW', 'staff_notification', 'staff', 'failed', 1, now()),
    ('R-STUCK', 'staff_notification', 'staff', 'pending', 1, now() - interval '6 minutes'),
    ('R-PENDING-NEW', 'staff_notification', 'staff', 'pending', 1, now()),
    ('R-EXHAUSTED', 'staff_notification', 'staff', 'failed', 5, now() - interval '1 hour'),
    ('R-SENT', 'staff_notification', 'staff', 'sent', 1, now() - interval '1 hour');
  set local role service_role;
  r := public.list_emails_to_retry(20);
  reset role;
  if jsonb_array_length(r) <> 2 then raise exception 'FAIL: retry list has % entries: %', jsonb_array_length(r), r; end if;
  if not (r::text like '%R-FAILED-OLD%' and r::text like '%R-STUCK%') then raise exception 'FAIL: wrong entries: %', r; end if;
  set local role service_role;
  if jsonb_array_length(public.list_emails_to_retry(1)) <> 1 then raise exception 'FAIL: limit ignored'; end if;
  reset role;
end $$;

-- 5b. Saved submissions that never got an email record are picked up (server stopped after saving).
do $$
declare r jsonb;
begin
  delete from public.email_log;
  -- Everything was just created, so nothing is overdue yet.
  set local role service_role; r := public.list_emails_to_retry(50); reset role;
  if jsonb_array_length(r) <> 0 then raise exception 'FAIL: fresh submissions listed as overdue: %', r; end if;
  -- Backdate one enquiry and one safeguarding report (test setup only; skips the updated_at trigger).
  set local session_replication_role = replica;
  update public.enquiry set created_at = now() - interval '5 minutes' where reference = (select v from t2_refs where k = 'enq');
  update public.contact_message set created_at = now() - interval '5 minutes' where reference = (select v from t2_refs where k = 'sgd');
  set local session_replication_role = origin;
  set local role service_role; r := public.list_emails_to_retry(50); reset role;
  if jsonb_array_length(r) <> 3 then raise exception 'FAIL: expected 3 missing emails, got %', r; end if;
  if not (r @> jsonb_build_array(jsonb_build_object('reference', (select v from t2_refs where k = 'enq'), 'template', 'staff_notification'))
      and r @> jsonb_build_array(jsonb_build_object('reference', (select v from t2_refs where k = 'enq'), 'template', 'sender_confirmation'))
      and r @> jsonb_build_array(jsonb_build_object('reference', (select v from t2_refs where k = 'sgd'), 'template', 'safeguarding_alert'))) then
    raise exception 'FAIL: wrong missing emails: %', r;
  end if;
  -- A safeguarding report never gets a staff notification or sender confirmation.
  if r @> jsonb_build_array(jsonb_build_object('reference', (select v from t2_refs where k = 'sgd'), 'template', 'staff_notification'))
     or r @> jsonb_build_array(jsonb_build_object('reference', (select v from t2_refs where k = 'sgd'), 'template', 'sender_confirmation')) then
    raise exception 'FAIL: safeguarding report queued for general staff or the reporter';
  end if;
  -- Once an email record exists it is no longer "missing".
  set local role service_role; perform public.claim_email((select v from t2_refs where k = 'enq'), 'staff_notification', 'staff'); r := public.list_emails_to_retry(50); reset role;
  if jsonb_array_length(r) <> 2 then raise exception 'FAIL: claimed email still listed as missing: %', r; end if;
end $$;

-- ================================================================================================
-- 6. Who can read the email log.
-- ================================================================================================
do $$
declare n int;
begin
  delete from public.email_log;
  insert into public.email_log (reference, template, recipient_kind, status) values
    ('MGA-ENQ-1', 'staff_notification', 'staff', 'sent'),
    ('MGA-SGD-1', 'safeguarding_alert', 'safeguarding', 'sent');
  perform pg_temp.act_as('authenticated', 'ops');
  select count(*) into n from public.email_log; if n <> 1 then raise exception 'FAIL: academy admin sees % log rows (expected 1, not the safeguarding alert)', n; end if;
  begin update public.email_log set status = 'failed'; raise exception 'FAIL: staff can edit the log';
  exception when insufficient_privilege then null; end;
  begin delete from public.email_log; raise exception 'FAIL: staff can delete log rows';
  exception when insufficient_privilege then null; end;
  reset role;
  perform pg_temp.act_as('authenticated', 'content');
  select count(*) into n from public.email_log; if n <> 0 then raise exception 'FAIL: content manager reads the email log'; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'safeguard');
  select count(*) into n from public.email_log; if n <> 2 then raise exception 'FAIL: lead sees % log rows', n; end if;
  reset role;
  perform pg_temp.act_as('authenticated', 'super');
  select count(*) into n from public.email_log; if n <> 2 then raise exception 'FAIL: super admin sees % log rows', n; end if;
  reset role;
end $$;

\echo 'ALL B2 ACCESS TESTS PASSED'
