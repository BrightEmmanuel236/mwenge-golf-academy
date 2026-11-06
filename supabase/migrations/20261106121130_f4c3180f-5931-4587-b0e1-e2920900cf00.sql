create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_ops_staff(uuid) set schema private;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function private.is_ops_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public, private as $$
  select private.has_role(_user_id, 'super_admin') or private.has_role(_user_id, 'academy_admin')
$$;
revoke all on function private.has_role(uuid, public.app_role) from public, anon;
revoke all on function private.is_ops_staff(uuid) from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_ops_staff(uuid) to authenticated, service_role;

alter table public.contact_message  add column if not exists internal_notes text, add column if not exists owner_id uuid;
alter table public.equipment_pledge add column if not exists internal_notes text, add column if not exists owner_id uuid;
alter table public.sponsor_enquiry  add column if not exists internal_notes text;

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  table_name text not null,
  reference text not null,
  is_safeguarding boolean not null default false,
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "Staff read audit log" on public.audit_log for select to authenticated using (
  (not is_safeguarding and private.is_ops_staff(auth.uid()))
  or private.has_role(auth.uid(), 'safeguarding_lead')
  or private.has_role(auth.uid(), 'super_admin'));
create index audit_log_reference_idx on public.audit_log (reference, created_at desc);

create or replace function private.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare col text; o text; n text;
begin
  foreach col in array tg_argv loop
    o := to_jsonb(old) ->> col; n := to_jsonb(new) ->> col;
    if o is distinct from n then
      insert into public.audit_log (actor_id, table_name, reference, is_safeguarding, field, old_value, new_value)
      values (auth.uid(), tg_table_name, new.reference,
        tg_table_name = 'contact_message' and (to_jsonb(new) ->> 'topic') = 'safeguarding',
        col, case when col = 'internal_notes' then null else o end,
             case when col = 'internal_notes' then '(notes edited)' else n end);
    end if;
  end loop;
  return new;
end $$;

create trigger enquiry_audit          after update on public.enquiry          for each row execute function private.write_audit('status','owner_id','internal_notes');
create trigger contact_message_audit  after update on public.contact_message  for each row execute function private.write_audit('status','owner_id','internal_notes');
create trigger sponsor_enquiry_audit  after update on public.sponsor_enquiry  for each row execute function private.write_audit('status','owner_id','internal_notes');
create trigger equipment_pledge_audit after update on public.equipment_pledge for each row execute function private.write_audit('status','owner_id','internal_notes');

create policy "Safeguarding staff update safeguarding messages" on public.contact_message
  for update to authenticated
  using (topic = 'safeguarding' and (private.has_role(auth.uid(), 'safeguarding_lead') or private.has_role(auth.uid(), 'super_admin')))
  with check (topic = 'safeguarding' and (private.has_role(auth.uid(), 'safeguarding_lead') or private.has_role(auth.uid(), 'super_admin')));

create or replace function public.staff_directory()
returns table (user_id uuid, email text) language sql stable security definer set search_path = public, private as $$
  select u.id, u.email::text from auth.users u
  where exists (select 1 from public.user_roles r where r.user_id = u.id)
    and (private.is_ops_staff(auth.uid()) or private.has_role(auth.uid(), 'safeguarding_lead'))
$$;
revoke all on function public.staff_directory() from public, anon;
grant execute on function public.staff_directory() to authenticated;