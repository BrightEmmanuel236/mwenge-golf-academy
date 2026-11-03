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
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    },
  },
});

const tables = [
  "user_roles",
  "reference_counter",
  "contact_person",
  "enquiry",
  "contact_message",
  "sponsor_enquiry",
  "equipment_pledge",
  "equipment_pledge_item",
  "submission_throttle",
];
const rpcs = [
  ["next_reference", { _kind: "ENQ" }],
  ["ensure_contact", { _email: "probe@example.com", _name: "x", _phone: "", _country: "" }],
  ["check_and_record_throttle", { _email_hash: "0".repeat(64), _ip_hash: "0".repeat(64) }],
  ["submit_enquiry", { p: {} }],
  ["submit_contact_message", { p: {} }],
  ["submit_sponsor_enquiry", { p: {} }],
  ["submit_equipment_pledge", { p: {} }],
];

const failures = [];
for (const table of tables) {
  const read = await supabase.from(table).select("*").limit(1);
  // Denied = an error, or (if a policy hides rows) zero rows. Any returned row is a leak.
  if (!read.error && (read.data?.length ?? 0) > 0) failures.push(`${table}: public READ returned rows`);
  if (!read.error) failures.push(`${table}: public READ was not refused (expected permission error)`);

  const write = await supabase.from(table).insert({});
  if (!write.error) failures.push(`${table}: public INSERT was accepted`);
  const update = await supabase.from(table).update({ updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (!update.error) failures.push(`${table}: public UPDATE was not refused`);
  const del = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (!del.error) failures.push(`${table}: public DELETE was not refused`);
}
for (const [fn, args] of rpcs) {
  const res = await supabase.rpc(fn, args);
  if (!res.error) failures.push(`${fn}: public call was accepted`);
}

if (failures.length) {
  console.error("FAIL\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${tables.length} tables and ${rpcs.length} functions refuse the public key.`);
