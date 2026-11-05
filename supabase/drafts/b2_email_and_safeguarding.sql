-- B2: email delivery log, safeguarding intake, and the data the emails are built from.
-- NOT APPLIED YET. Requires B1 (b1_public_forms) to be applied first. PRD refs: W1, W3, W4, W9, W10,
-- AC-E1, AC-Q2, AC-Q3, §9.2 (email_log), §11.4 (stored before notification; retry for email failures).

-- ---------------------------------------------------------------------------------------------
-- 1. Safeguarding concerns may be anonymous and are never linked to a general contact record
--    (a contact record is visible to office staff; a safeguarding report must not be).
-- ---------------------------------------------------------------------------------------------
alter table public.reference_counter drop constraint reference_counter_kind_check;
alter table public.reference_counter
  add constraint reference_counter_kind_check check (kind in ('ENQ', 'MSG', 'SPN', 'PLG', 'SGD'));

alter table public.contact_message alter column contact_person_id drop not null;
alter table public.contact_message
  add constraint contact_message_person_unless_safeguarding
  check (topic = 'safeguarding' or contact_person_id is not null);
-- Reporter's email, kept on the (restricted) message itself; only ever set for safeguarding concerns.
alter table public.contact_message
  add column submitted_email text check (submitted_email is null or char_length(submitted_email) <= 254);

drop trigger contact_message_protect on public.contact_message;
create trigger contact_message_protect before update on public.contact_message
  for each row execute function public.protect_submission_fields('reference', 'contact_person_id',
    'submitted_name', 'submitted_phone', 'submitted_email', 'topic', 'message', 'created_at');

-- Server-only entry point. The general contact function keeps refusing the safeguarding topic.
create or replace function public.submit_safeguarding_concern(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare ref text;
begin
  ref := public.next_reference('SGD');
  insert into public.contact_message (reference, contact_person_id, submitted_name, submitted_phone,
    submitted_email, topic, message)
  values (ref, null, coalesce(nullif(trim(p->>'name'), ''), 'Anonymous'), nullif(p->>'phone', ''),
    nullif(lower(trim(p->>'email')), ''), 'safeguarding', p->>'message');
  return ref;
end $$;
revoke all on function public.submit_safeguarding_concern(jsonb) from public, anon, authenticated;
grant execute on function public.submit_safeguarding_concern(jsonb) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Email log (PRD §9.2). Records that an email was attempted and how it went. It stores no
--    addresses and no message text: only the reference, which template, who it was for (by kind).
-- ---------------------------------------------------------------------------------------------
create type public.email_status as enum ('pending', 'sent', 'failed');

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  template text not null check (template in ('staff_notification', 'sender_confirmation', 'safeguarding_alert')),
  recipient_kind text not null check (recipient_kind in ('staff', 'sender', 'safeguarding')),
  status public.email_status not null default 'pending',
  attempts int not null default 1 check (attempts >= 0),
  provider_id text check (provider_id is null or char_length(provider_id) <= 100),
  error_code text check (error_code is null or char_length(error_code) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (reference, template)
);
create index email_log_retry on public.email_log (status, updated_at);
alter table public.email_log enable row level security;
-- Office staff see the log except safeguarding alerts; the Safeguarding Lead and Super Admin see all.
create policy "Staff read email log" on public.email_log
  for select to authenticated
  using ((template <> 'safeguarding_alert' and public.is_ops_staff(auth.uid()))
      or public.has_role(auth.uid(), 'safeguarding_lead')
      or public.has_role(auth.uid(), 'super_admin'));
create trigger email_log_touch before update on public.email_log
  for each row execute function public.touch_updated_at();

revoke all on public.email_log from anon, authenticated;
grant select on public.email_log to authenticated;
grant all on public.email_log to service_role;

-- Takes the right to send one email. True = this caller should send now. A second concurrent caller
-- (or a repeat after success) gets false, so nothing is sent twice. Failed or stuck attempts can be
-- taken again, up to 5 tries.
create or replace function public.claim_email(_reference text, _template text, _recipient_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.email_log (reference, template, recipient_kind)
  values (_reference, _template, _recipient_kind)
  on conflict (reference, template) do update
    set status = 'pending', attempts = email_log.attempts + 1, error_code = null, updated_at = now()
    where email_log.attempts < 5
      and ((email_log.status = 'failed')
        or (email_log.status = 'pending' and email_log.updated_at < now() - interval '5 minutes'));
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Records the outcome. Setup problems (no provider key, no recipients) do not use up the 5 tries,
-- so the email still goes out once the setting is fixed.
create or replace function public.finish_email(_reference text, _template text, _ok boolean,
  _provider_id text, _error_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.email_log set
    status = case when _ok then 'sent' else 'failed' end::public.email_status,
    provider_id = case when _ok then left(_provider_id, 100) else provider_id end,
    error_code = case when _ok then null else left(coalesce(_error_code, 'unknown'), 60) end,
    sent_at = case when _ok then now() else sent_at end,
    attempts = case when not _ok and _error_code in ('not_configured', 'no_recipients')
                    then greatest(attempts - 1, 0) else attempts end
  where reference = _reference and template = _template;
end $$;

-- Emails to (re)try: failed or stuck ones, plus saved submissions from the last 3 days that never got
-- an email record at all (for example the server stopped right after saving). Nothing saved is lost.
create or replace function public.list_emails_to_retry(_limit int)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('reference', reference, 'template', template)), '[]'::jsonb)
  from (
    select reference, template, updated_at as ordered_at from public.email_log
    where attempts < 5
      and ((status = 'failed' and updated_at < now() - interval '2 minutes')
        or (status = 'pending' and updated_at < now() - interval '5 minutes'))
    union all
    select s.reference, t.template, s.created_at
    from (
      select reference, created_at, 'staff' as audience from public.enquiry
      union all select reference, created_at, 'staff' from public.sponsor_enquiry
      union all select reference, created_at, 'staff' from public.equipment_pledge
      union all select reference, created_at, case when topic = 'safeguarding' then 'safeguarding' else 'staff' end
        from public.contact_message
    ) s
    join lateral (
      select 'staff_notification' as template where s.audience = 'staff'
      union all select 'sender_confirmation' where s.audience = 'staff'
      union all select 'safeguarding_alert' where s.audience = 'safeguarding'
    ) t on true
    where s.created_at < now() - interval '2 minutes'
      and s.created_at > now() - interval '3 days'
      and not exists (select 1 from public.email_log l where l.reference = s.reference and l.template = t.template)
    order by ordered_at
    limit least(greatest(coalesce(_limit, 20), 1), 50)
  ) q
$$;

-- ---------------------------------------------------------------------------------------------
-- 3. What an email may contain, in one place. Child details (name, age, declaration) are never
--    included: emails travel through outside systems, so they carry the minimum (PRD §10.2).
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_submission_for_email(_reference text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if _reference like 'MGA-ENQ-%' then
    select jsonb_build_object('kind', 'enquiry', 'reference', e.reference, 'created_at', e.created_at,
      'name', e.submitted_name, 'email', c.email, 'phone', e.submitted_phone, 'message', e.message,
      'audience', e.audience, 'organization', e.organization, 'program_slug', e.program_slug,
      'preferred_start', e.preferred_start, 'is_junior', e.audience = 'junior',
      'guardian_relationship', e.guardian_relationship)
    into r from public.enquiry e join public.contact_person c on c.id = e.contact_person_id
    where e.reference = _reference;
  elsif _reference like 'MGA-MSG-%' then
    select jsonb_build_object('kind', 'contact', 'reference', m.reference, 'created_at', m.created_at,
      'name', m.submitted_name, 'email', c.email, 'phone', m.submitted_phone, 'message', m.message,
      'topic', m.topic)
    into r from public.contact_message m join public.contact_person c on c.id = m.contact_person_id
    where m.reference = _reference and m.topic <> 'safeguarding';
  elsif _reference like 'MGA-SGD-%' then
    select jsonb_build_object('kind', 'safeguarding', 'reference', m.reference, 'created_at', m.created_at,
      'name', m.submitted_name, 'email', m.submitted_email, 'phone', m.submitted_phone, 'message', m.message)
    into r from public.contact_message m
    where m.reference = _reference and m.topic = 'safeguarding';
  elsif _reference like 'MGA-SPN-%' then
    select jsonb_build_object('kind', 'sponsor', 'reference', s.reference, 'created_at', s.created_at,
      'name', s.submitted_name, 'email', c.email, 'phone', s.submitted_phone, 'message', s.message,
      'organization', s.organization, 'interests', to_jsonb(s.interests))
    into r from public.sponsor_enquiry s join public.contact_person c on c.id = s.contact_person_id
    where s.reference = _reference;
  elsif _reference like 'MGA-PLG-%' then
    select jsonb_build_object('kind', 'pledge', 'reference', p.reference, 'created_at', p.created_at,
      'name', p.submitted_name, 'email', c.email, 'phone', p.submitted_phone, 'organization', p.organization,
      'origin_country', p.origin_country, 'shipping_plan', p.shipping_plan, 'expected_date', p.expected_date,
      'notes', p.notes,
      'items', coalesce((select jsonb_agg(jsonb_build_object('description', i.description,
        'quantity', i.quantity, 'condition', i.condition) order by i.created_at)
        from public.equipment_pledge_item i where i.pledge_id = p.id), '[]'::jsonb))
    into r from public.equipment_pledge p join public.contact_person c on c.id = p.contact_person_id
    where p.reference = _reference;
  end if;
  return r;
end $$;

-- ---------------------------------------------------------------------------------------------
-- 4. Only the server may call these.
-- ---------------------------------------------------------------------------------------------
revoke all on function public.claim_email(text, text, text) from public, anon, authenticated;
revoke all on function public.finish_email(text, text, boolean, text, text) from public, anon, authenticated;
revoke all on function public.list_emails_to_retry(int) from public, anon, authenticated;
revoke all on function public.get_submission_for_email(text) from public, anon, authenticated;
grant execute on function public.claim_email(text, text, text) to service_role;
grant execute on function public.finish_email(text, text, boolean, text, text) to service_role;
grant execute on function public.list_emails_to_retry(int) to service_role;
grant execute on function public.get_submission_for_email(text) to service_role;
