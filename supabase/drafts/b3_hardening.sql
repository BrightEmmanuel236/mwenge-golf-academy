-- B3 hardening. Goes on top of migration 20261106121130 (the B3-core migration, already applied), which
-- created the audit log and moved the role helpers into the private schema.
-- NOT APPLIED YET. PRD refs: §9.2 (audit_log), §10.1 (least privilege), AC-A1.

-- 1. Least privilege. Supabase grants every new table to anon and authenticated by default, including
--    TRUNCATE, which row-level security does not cover. The audit log was created without removing that.
revoke all on public.audit_log from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.audit_log to authenticated;

-- 2. The audit log is append-only for everyone, including the server key and the table owner.
create or replace function private.audit_log_is_append_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
revoke all on function private.audit_log_is_append_only() from public, anon, authenticated;
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.audit_log_is_append_only();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_is_append_only();
alter table public.audit_log add constraint audit_log_field_check
  check (field in ('status', 'owner_id', 'internal_notes'));

-- 3. The audit trigger function is for the triggers only.
revoke all on function private.write_audit() from public, anon, authenticated;

-- 4. Notes have a length limit on every submission type, like every other free-text field.
alter table public.enquiry add constraint enquiry_internal_notes_len
  check (internal_notes is null or char_length(internal_notes) <= 4000);
alter table public.contact_message add constraint contact_message_internal_notes_len
  check (internal_notes is null or char_length(internal_notes) <= 4000);
alter table public.sponsor_enquiry add constraint sponsor_enquiry_internal_notes_len
  check (internal_notes is null or char_length(internal_notes) <= 4000);
alter table public.equipment_pledge add constraint equipment_pledge_internal_notes_len
  check (internal_notes is null or char_length(internal_notes) <= 4000);
