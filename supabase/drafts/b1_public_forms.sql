-- B1 DRAFT: for review only. NOT applied. Do not run until approved.
-- PRD refs: §5 (all forms), W1, W3, W4, W9, W10, §8.1-8.2, §9.2-9.3, §10.1-10.2.
-- Kept outside supabase/migrations/ on purpose: that folder is written by the migration tool when a
-- migration actually runs, so a hand-written file there would look applied when it is not.

-- ---------------------------------------------------------------------------------------------
-- 1. Staff roles (§8.1). Roles live in their own table, never on a profile.
-- ---------------------------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'academy_admin', 'content_manager', 'safeguarding_lead');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Staff read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create or replace function public.is_ops_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'super_admin') or public.has_role(_user_id, 'academy_admin')
$$;
revoke all on function public.is_ops_staff(uuid) from public, anon;
grant execute on function public.is_ops_staff(uuid) to authenticated, service_role;

-- Shared updated_at trigger.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------------------------------
-- 2. Reference numbers: MGA-<TYPE>-<YEAR>-<0000>, gap-tolerant, safe under concurrency.
-- ---------------------------------------------------------------------------------------------
create table public.reference_counter (
  kind text not null check (kind in ('ENQ', 'MSG', 'SPN', 'PLG')),
  year int not null,
  last_value int not null default 0,
  primary key (kind, year)
);
grant all on public.reference_counter to service_role;
alter table public.reference_counter enable row level security;
-- No policies: only security-definer functions touch it.

create or replace function public.next_reference(_kind text)
returns text language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now() at time zone 'Africa/Kampala'); n int;
begin
  insert into public.reference_counter (kind, year, last_value) values (_kind, y, 1)
  on conflict (kind, year) do update set last_value = reference_counter.last_value + 1
  returning last_value into n;
  return format('MGA-%s-%s-%s', _kind, y, lpad(n::text, 4, '0'));
end $$;
revoke all on function public.next_reference(text) from public, anon, authenticated;
grant execute on function public.next_reference(text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 3. Contact people (§9.2). A public submission NEVER overwrites an existing contact's name,
--    phone, country or marketing opt-in (amendment 3): insert-if-absent only.
-- ---------------------------------------------------------------------------------------------
create table public.contact_person (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null check (char_length(name) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 30),
  country text check (country is null or char_length(country) <= 80),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_person_email_lower check (email = lower(email) and char_length(email) <= 254)
);
create unique index contact_person_email_key on public.contact_person (email);
grant select, update on public.contact_person to authenticated;
grant all on public.contact_person to service_role;
alter table public.contact_person enable row level security;
create policy "Ops staff read contacts" on public.contact_person
  for select to authenticated using (public.is_ops_staff(auth.uid()));
create policy "Ops staff update contacts" on public.contact_person
  for update to authenticated using (public.is_ops_staff(auth.uid())) with check (public.is_ops_staff(auth.uid()));
create trigger contact_person_touch before update on public.contact_person
  for each row execute function public.touch_updated_at();

-- Returns the existing contact id untouched, or creates one. Submitted details for an existing
-- contact are kept on the submission row itself (snapshot columns), not merged into the contact.
create or replace function public.ensure_contact(_email text, _name text, _phone text, _country text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  insert into public.contact_person (email, name, phone, country)
  values (lower(trim(_email)), _name, nullif(_phone, ''), nullif(_country, ''))
  on conflict (email) do nothing
  returning id into cid;
  if cid is null then
    select id into cid from public.contact_person where email = lower(trim(_email));
  end if;
  return cid;
end $$;
revoke all on function public.ensure_contact(text, text, text, text) from public, anon, authenticated;
grant execute on function public.ensure_contact(text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 4. Submission tables. Each keeps a snapshot of what the sender typed (amendment 3).
-- ---------------------------------------------------------------------------------------------
create type public.enquiry_status as enum ('new', 'contacted', 'confirmed', 'waitlisted', 'declined', 'closed');
create type public.audience_type as enum ('adult', 'corporate', 'junior');

create table public.enquiry (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  contact_person_id uuid not null references public.contact_person(id),
  program_slug text check (program_slug is null or char_length(program_slug) <= 120),
  audience public.audience_type not null,
  submitted_name text not null check (char_length(submitted_name) between 1 and 120),
  submitted_phone text not null check (char_length(submitted_phone) <= 30),
  organization text check (organization is null or char_length(organization) <= 160),
  preferred_start text check (preferred_start is null or char_length(preferred_start) <= 120),
  message text not null check (char_length(message) between 1 and 1500),
  guardian_relationship text check (guardian_relationship is null or char_length(guardian_relationship) <= 60),
  child_first_name text check (child_first_name is null or char_length(child_first_name) <= 60),
  child_age int check (child_age is null or child_age between 4 and 17),
  guardian_declaration boolean not null default false,
  status public.enquiry_status not null default 'new',
  owner_id uuid,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- AC-E2: junior enquiries require guardian details and the declaration.
  constraint enquiry_junior_fields check (
    audience <> 'junior' or (guardian_relationship is not null and child_first_name is not null
      and child_age is not null and guardian_declaration)
  ),
  constraint enquiry_corporate_org check (audience <> 'corporate' or organization is not null)
);
grant select, update on public.enquiry to authenticated;
grant all on public.enquiry to service_role;
alter table public.enquiry enable row level security;
create policy "Ops staff and safeguarding read enquiries" on public.enquiry
  for select to authenticated
  using (public.is_ops_staff(auth.uid()) or public.has_role(auth.uid(), 'safeguarding_lead'));
create policy "Ops staff update enquiries" on public.enquiry
  for update to authenticated using (public.is_ops_staff(auth.uid())) with check (public.is_ops_staff(auth.uid()));
create trigger enquiry_touch before update on public.enquiry
  for each row execute function public.touch_updated_at();

-- Contact messages. 'safeguarding' exists in the type for later, but the submit function
-- refuses it until delivery to the Safeguarding Lead exists (amendment 2, W10, AC-Q3).
create type public.message_status as enum ('new', 'replied', 'closed');
create type public.contact_topic as enum
  ('training', 'youth', 'donation', 'equipment', 'partnership', 'media', 'other', 'safeguarding');

create table public.contact_message (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  contact_person_id uuid not null references public.contact_person(id),
  submitted_name text not null check (char_length(submitted_name) between 1 and 120),
  submitted_phone text check (submitted_phone is null or char_length(submitted_phone) <= 30),
  topic public.contact_topic not null,
  message text not null check (char_length(message) between 1 and 2000),
  status public.message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.contact_message to authenticated;
grant all on public.contact_message to service_role;
alter table public.contact_message enable row level security;
create policy "Ops staff read non-safeguarding messages" on public.contact_message
  for select to authenticated
  using ((topic <> 'safeguarding' and (public.is_ops_staff(auth.uid()) or public.has_role(auth.uid(), 'safeguarding_lead')))
      or (topic = 'safeguarding' and (public.has_role(auth.uid(), 'safeguarding_lead') or public.has_role(auth.uid(), 'super_admin'))));
create policy "Ops staff update non-safeguarding messages" on public.contact_message
  for update to authenticated
  using (topic <> 'safeguarding' and public.is_ops_staff(auth.uid()))
  with check (topic <> 'safeguarding' and public.is_ops_staff(auth.uid()));
create trigger contact_message_touch before update on public.contact_message
  for each row execute function public.touch_updated_at();

create type public.sponsor_status as enum ('new', 'in_discussion', 'agreed', 'not_proceeding');
create table public.sponsor_enquiry (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  contact_person_id uuid not null references public.contact_person(id),
  organization text not null check (char_length(organization) between 1 and 160),
  submitted_name text not null check (char_length(submitted_name) between 1 and 120),
  submitted_phone text check (submitted_phone is null or char_length(submitted_phone) <= 30),
  interests text[] not null check (cardinality(interests) between 1 and 5),
  message text not null check (char_length(message) between 1 and 2000),
  status public.sponsor_status not null default 'new',
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.sponsor_enquiry to authenticated;
grant all on public.sponsor_enquiry to service_role;
alter table public.sponsor_enquiry enable row level security;
create policy "Ops staff and safeguarding read sponsors" on public.sponsor_enquiry
  for select to authenticated
  using (public.is_ops_staff(auth.uid()) or public.has_role(auth.uid(), 'safeguarding_lead'));
create policy "Ops staff update sponsors" on public.sponsor_enquiry
  for update to authenticated using (public.is_ops_staff(auth.uid())) with check (public.is_ops_staff(auth.uid()));
create trigger sponsor_enquiry_touch before update on public.sponsor_enquiry
  for each row execute function public.touch_updated_at();

create type public.pledge_status as enum
  ('submitted', 'accepted', 'needs_changes', 'declined', 'in_transit', 'received', 'distributed');
create type public.shipping_plan as enum ('donor-ships', 'needs-help', 'undecided');
create type public.equipment_condition as enum ('new', 'like-new', 'good', 'fair');

create table public.equipment_pledge (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  contact_person_id uuid not null references public.contact_person(id),
  submitted_name text not null check (char_length(submitted_name) between 1 and 120),
  submitted_phone text check (submitted_phone is null or char_length(submitted_phone) <= 30),
  organization text check (organization is null or char_length(organization) <= 160),
  origin_country text not null check (char_length(origin_country) between 1 and 80),
  shipping_plan public.shipping_plan not null,
  expected_date text check (expected_date is null or char_length(expected_date) <= 60),
  recognition_opt_in boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 1500),
  status public.pledge_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.equipment_pledge to authenticated;
grant all on public.equipment_pledge to service_role;
alter table public.equipment_pledge enable row level security;
create policy "Ops staff and safeguarding read pledges" on public.equipment_pledge
  for select to authenticated
  using (public.is_ops_staff(auth.uid()) or public.has_role(auth.uid(), 'safeguarding_lead'));
create policy "Ops staff update pledges" on public.equipment_pledge
  for update to authenticated using (public.is_ops_staff(auth.uid())) with check (public.is_ops_staff(auth.uid()));
create trigger equipment_pledge_touch before update on public.equipment_pledge
  for each row execute function public.touch_updated_at();

create table public.equipment_pledge_item (
  id uuid primary key default gen_random_uuid(),
  pledge_id uuid not null references public.equipment_pledge(id) on delete cascade,
  need_id uuid,
  description text not null check (char_length(description) between 1 and 200),
  quantity int not null check (quantity between 1 and 10000),
  condition public.equipment_condition not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.equipment_pledge_item to authenticated;
grant all on public.equipment_pledge_item to service_role;
alter table public.equipment_pledge_item enable row level security;
create policy "Ops staff and safeguarding read pledge items" on public.equipment_pledge_item
  for select to authenticated
  using (public.is_ops_staff(auth.uid()) or public.has_role(auth.uid(), 'safeguarding_lead'));
create trigger equipment_pledge_item_touch before update on public.equipment_pledge_item
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- 5. Throttle (amendment 4). Keys are SHA-256 hashes made server-side; no raw IP or email stored.
--    Per email: 5 per 10 minutes. Per IP: 30 per 10 minutes (shared networks, schools, offices).
--    Rows older than 24 hours are purged on every check, so no scheduled job is needed.
-- ---------------------------------------------------------------------------------------------
create table public.submission_throttle (
  id bigint generated always as identity primary key,
  key_kind text not null check (key_kind in ('email', 'ip')),
  key_hash text not null check (char_length(key_hash) = 64),
  created_at timestamptz not null default now()
);
create index submission_throttle_lookup on public.submission_throttle (key_kind, key_hash, created_at);
create index submission_throttle_age on public.submission_throttle (created_at);
grant all on public.submission_throttle to service_role;
alter table public.submission_throttle enable row level security;
-- No policies: service role only.

create or replace function public.check_and_record_throttle(_email_hash text, _ip_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare email_count int; ip_count int;
begin
  delete from public.submission_throttle where created_at < now() - interval '24 hours';
  select count(*) into email_count from public.submission_throttle
    where key_kind = 'email' and key_hash = _email_hash and created_at > now() - interval '10 minutes';
  select count(*) into ip_count from public.submission_throttle
    where key_kind = 'ip' and key_hash = _ip_hash and created_at > now() - interval '10 minutes';
  if email_count >= 5 or ip_count >= 30 then
    return false;
  end if;
  insert into public.submission_throttle (key_kind, key_hash) values ('email', _email_hash), ('ip', _ip_hash);
  return true;
end $$;
revoke all on function public.check_and_record_throttle(text, text) from public, anon, authenticated;
grant execute on function public.check_and_record_throttle(text, text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 6. Submit functions: one transaction each, callable only by the server (service role) after
--    the server has re-validated input, checked the honeypot and passed the throttle.
-- ---------------------------------------------------------------------------------------------
create or replace function public.submit_enquiry(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; ref text;
begin
  cid := public.ensure_contact(p->>'email', p->>'name', p->>'phone', null);
  ref := public.next_reference('ENQ');
  insert into public.enquiry (reference, contact_person_id, program_slug, audience, submitted_name,
    submitted_phone, organization, preferred_start, message, guardian_relationship, child_first_name,
    child_age, guardian_declaration)
  values (ref, cid, nullif(p->>'programSlug', ''), (p->>'audience')::public.audience_type, p->>'name',
    p->>'phone', nullif(p->>'organization', ''), nullif(p->>'preferredStart', ''), p->>'message',
    nullif(p->>'guardianRelationship', ''), nullif(p->>'childFirstName', ''),
    (p->>'childAge')::int, coalesce((p->>'guardianDeclaration')::boolean, false));
  return ref;
end $$;

create or replace function public.submit_contact_message(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; ref text;
begin
  if p->>'topic' = 'safeguarding' then
    raise exception 'safeguarding_intake_disabled' using errcode = 'P0001';
  end if;
  cid := public.ensure_contact(p->>'email', p->>'name', p->>'phone', null);
  ref := public.next_reference('MSG');
  insert into public.contact_message (reference, contact_person_id, submitted_name, submitted_phone, topic, message)
  values (ref, cid, p->>'name', nullif(p->>'phone', ''), (p->>'topic')::public.contact_topic, p->>'message');
  return ref;
end $$;

create or replace function public.submit_sponsor_enquiry(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; ref text;
begin
  cid := public.ensure_contact(p->>'email', p->>'name', p->>'phone', null);
  ref := public.next_reference('SPN');
  insert into public.sponsor_enquiry (reference, contact_person_id, organization, submitted_name, submitted_phone, interests, message)
  values (ref, cid, p->>'organization', p->>'name', nullif(p->>'phone', ''),
    array(select jsonb_array_elements_text(p->'interests')), p->>'message');
  return ref;
end $$;

create or replace function public.submit_equipment_pledge(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; ref text; pid uuid;
begin
  if jsonb_array_length(coalesce(p->'items', '[]'::jsonb)) < 1 then
    raise exception 'pledge_needs_items' using errcode = 'P0001';
  end if;
  cid := public.ensure_contact(p->>'email', p->>'name', p->>'phone', p->>'originCountry');
  ref := public.next_reference('PLG');
  insert into public.equipment_pledge (reference, contact_person_id, submitted_name, submitted_phone, organization,
    origin_country, shipping_plan, expected_date, recognition_opt_in, notes)
  values (ref, cid, p->>'name', nullif(p->>'phone', ''), nullif(p->>'organization', ''), p->>'originCountry',
    (p->>'shippingPlan')::public.shipping_plan, nullif(p->>'expectedDate', ''),
    coalesce((p->>'recognitionOptIn')::boolean, false), nullif(p->>'notes', ''))
  returning id into pid;
  insert into public.equipment_pledge_item (pledge_id, description, quantity, condition)
  select pid, i->>'description', (i->>'quantity')::int, (i->>'condition')::public.equipment_condition
  from jsonb_array_elements(p->'items') i;
  return ref;
end $$;

revoke all on function public.submit_enquiry(jsonb) from public, anon, authenticated;
revoke all on function public.submit_contact_message(jsonb) from public, anon, authenticated;
revoke all on function public.submit_sponsor_enquiry(jsonb) from public, anon, authenticated;
revoke all on function public.submit_equipment_pledge(jsonb) from public, anon, authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;
grant execute on function public.submit_contact_message(jsonb) to service_role;
grant execute on function public.submit_sponsor_enquiry(jsonb) to service_role;
grant execute on function public.submit_equipment_pledge(jsonb) to service_role;
