#!/usr/bin/env node
/**
 * B1 access check (amendment 5). Run against a STAGING Supabase project only:
 *   STAGING_SUPABASE_URL=... STAGING_SUPABASE_PUBLISHABLE_KEY=... bun scripts/check-rls-staging.mjs
 * Uses only the public key. Every table must refuse read and write, and every server-only
 * function must refuse to run. Exits 1 on any leak.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env["STAGING_SUPABASE_URL"];
const key = process.env["STAGING_SUPABASE_PUBLISHABLE_KEY"];
if (!url || !key) {
  console.error("Set STAGING_SUPABASE_URL and STAGING_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(2);
}
if (/sb_secret_|service_role/.test(key)) {
  console.error("Refusing to run: this must be the public key, not a secret key.");
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
        h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    },
  },
});

// For each table: a column that exists (so update/delete probes are well-formed requests that can
// only fail because of permissions, never because of a typo) and a harmless value to write to it.
const tables = {
  user_roles: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { role: "content_manager" },
  },
  reference_counter: { filter: ["year", 0], patch: { last_value: 0 } },
  contact_person: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  enquiry: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  contact_message: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  sponsor_enquiry: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  equipment_pledge: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  equipment_pledge_item: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { updated_at: "2000-01-01T00:00:00Z" },
  },
  submission_throttle: {
    filter: ["created_at", "1970-01-01T00:00:00Z"],
    patch: { key_kind: "ip" },
  },
};
const rpcs = [
  ["has_role", { _user_id: "00000000-0000-0000-0000-000000000000", _role: "super_admin" }],
  ["is_ops_staff", { _user_id: "00000000-0000-0000-0000-000000000000" }],
  ["next_reference", { _kind: "ENQ" }],
  ["ensure_contact", { _email: "probe@example.com", _name: "x", _phone: "", _country: "" }],
  ["check_and_record_throttle", { _email_hash: "0".repeat(64), _ip_hash: "0".repeat(64) }],
  ["submit_enquiry", { p: {} }],
  ["submit_contact_message", { p: {} }],
  ["submit_sponsor_enquiry", { p: {} }],
  ["submit_equipment_pledge", { p: {} }],
];

const failures = [];
for (const [table, { filter, patch }] of Object.entries(tables)) {
  const read = await supabase.from(table).select("*").limit(1);
  // Denied = an error. A table that answers at all (even with zero rows) is not locked down.
  if (!read.error && (read.data?.length ?? 0) > 0)
    failures.push(`${table}: public READ returned rows`);
  if (!read.error)
    failures.push(`${table}: public READ was not refused (expected permission error)`);

  const write = await supabase.from(table).insert({});
  if (!write.error) failures.push(`${table}: public INSERT was accepted`);
  const update = await supabase
    .from(table)
    .update(patch)
    .gte(...filter);
  if (!update.error) failures.push(`${table}: public UPDATE was not refused`);
  const del = await supabase
    .from(table)
    .delete()
    .gte(...filter);
  if (!del.error) failures.push(`${table}: public DELETE was not refused`);
  // Show why each was refused, so a refusal for the wrong reason (for example a malformed request) is visible.
  console.log(
    `${table}: read ${read.error?.code ?? "OK(!)"}, insert ${write.error?.code ?? "OK(!)"}, update ${update.error?.code ?? "OK(!)"}, delete ${del.error?.code ?? "OK(!)"}`,
  );
}
for (const [fn, args] of rpcs) {
  const res = await supabase.rpc(fn, args);
  if (!res.error) failures.push(`${fn}: public call was accepted`);
}

if (failures.length) {
  console.error("FAIL\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log(
  `PASS: ${Object.keys(tables).length} tables and ${rpcs.length} functions refuse the public key.`,
);
