import { supabase } from "@/integrations/supabase/client";
import { inboxKinds, isOverdue, statusLabel, type InboxKind } from "./inbox";

/**
 * Reading and working submissions in the staff area. Everything goes through the signed-in person's own
 * session, so the database's access rules (roles, multi-factor, restricted safeguarding reports) decide what
 * comes back. Nothing here can see more than the person is allowed to. A search that returns nothing is
 * therefore ambiguous on purpose: "none" and "not allowed" look the same.
 */

type DbError = { message: string; code?: string | undefined } | null;
interface DbResult {
  data: unknown;
  error: DbError;
  count?: number | null | undefined;
}
interface QueryBuilder extends PromiseLike<DbResult> {
  select(columns: string, options?: { count?: "exact" }): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  order(column: string, options?: { ascending: boolean }): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  limit(count: number): QueryBuilder;
  update(values: Record<string, unknown>): QueryBuilder;
}
interface Db {
  from(table: string): QueryBuilder;
  rpc(name: string): QueryBuilder;
}
// The generated types do not model dynamic table names; this keeps the access narrow and typed.
const db = (): Db => supabase as unknown as Db;

export type Result<T> = { ok: true; data: T } | { ok: false; message: string };
const failed = (message: string): { ok: false; message: string } => ({ ok: false, message });
const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
const text = (value: unknown): string =>
  typeof value === "string" ? value : value == null ? "" : String(value);

// ---------------------------------------------------------------------------------------------
// Which list is which (URL names <-> kinds)
// ---------------------------------------------------------------------------------------------
export const kindSlugs: Record<InboxKind, string> = {
  enquiry: "enquiries",
  contact: "messages",
  sponsor: "sponsors",
  pledge: "pledges",
};
export function kindFromSlug(slug: string): InboxKind | null {
  return (Object.keys(kindSlugs) as InboxKind[]).find((kind) => kindSlugs[kind] === slug) ?? null;
}

// ---------------------------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------------------------
const listColumns: Record<InboxKind, string> = {
  enquiry: "reference,status,created_at,submitted_name,audience,program_slug",
  contact: "reference,status,created_at,submitted_name,topic",
  sponsor: "reference,status,created_at,submitted_name,organization",
  pledge: "reference,status,created_at,submitted_name,origin_country",
};

export const PAGE_SIZE = 25;

export interface ListRow {
  reference: string;
  status: string;
  createdAt: string;
  name: string;
  summary: string;
  /** Safeguarding reports: shown with a "Restricted" marker. */
  restricted: boolean;
}

export function toListRow(kind: InboxKind, row: Record<string, unknown>): ListRow {
  const summary =
    kind === "enquiry"
      ? [text(row["audience"]), text(row["program_slug"])].filter(Boolean).join(" · ")
      : kind === "contact"
        ? text(row["topic"])
        : kind === "sponsor"
          ? text(row["organization"])
          : text(row["origin_country"]);
  return {
    reference: text(row["reference"]),
    status: text(row["status"]),
    createdAt: text(row["created_at"]),
    name: text(row["submitted_name"]),
    summary,
    restricted: kind === "contact" && row["topic"] === "safeguarding",
  };
}

export async function listSubmissions(
  kind: InboxKind,
  options: { status?: string | undefined; page?: number | undefined } = {},
): Promise<Result<{ rows: ListRow[]; total: number }>> {
  const cfg = inboxKinds[kind];
  const page = Math.max(0, Math.floor(options.page ?? 0));
  let query = db().from(cfg.table).select(listColumns[kind], { count: "exact" });
  if (options.status && cfg.statuses.includes(options.status))
    query = query.eq("status", options.status);
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) return failed("The list could not be loaded. Try again.");
  return {
    ok: true,
    data: { rows: rows(data).map((row) => toListRow(kind, row)), total: count ?? 0 },
  };
}

// ---------------------------------------------------------------------------------------------
// One record
// ---------------------------------------------------------------------------------------------
export interface DetailField {
  label: string;
  value: string;
}
export interface PledgeItem {
  description: string;
  quantity: number;
  condition: string;
}
export interface Detail {
  kind: InboxKind;
  reference: string;
  status: string;
  notes: string;
  createdAt: string;
  restricted: boolean;
  /** True for a junior enquiry: the fields include a child's details, which are never sent by email. */
  hasChildDetails: boolean;
  fields: DetailField[];
  items: PledgeItem[];
}

const present = (pairs: [string, string][]): DetailField[] =>
  pairs.filter(([, value]) => value.trim() !== "").map(([label, value]) => ({ label, value }));

/** What a staff member sees for a record. Child details appear only for a junior enquiry. */
export function buildFields(
  kind: InboxKind,
  row: Record<string, unknown>,
  contact: { email: string; phone: string } | null,
): { fields: DetailField[]; hasChildDetails: boolean } {
  const email = contact?.email || text(row["submitted_email"]);
  const phone = text(row["submitted_phone"]) || contact?.phone || "";
  const who: [string, string][] = [
    ["Name", text(row["submitted_name"])],
    ["Email", email],
    ["Phone", phone],
  ];
  switch (kind) {
    case "enquiry": {
      const junior = row["audience"] === "junior";
      return {
        hasChildDetails: junior,
        fields: present([
          ...who,
          ["For", text(row["audience"])],
          ["Programme", text(row["program_slug"])],
          ["Organization", text(row["organization"])],
          ["Preferred start", text(row["preferred_start"])],
          ["Message", text(row["message"])],
          ...(junior
            ? ([
                ["Guardian's relationship to the child", text(row["guardian_relationship"])],
                ["Child's first name", text(row["child_first_name"])],
                ["Child's age", text(row["child_age"])],
                [
                  "Guardian declaration",
                  row["guardian_declaration"] === true
                    ? "Confirmed by the guardian"
                    : "Not confirmed",
                ],
              ] as [string, string][])
            : []),
        ]),
      };
    }
    case "contact":
      return {
        hasChildDetails: false,
        fields: present([...who, ["About", text(row["topic"])], ["Message", text(row["message"])]]),
      };
    case "sponsor":
      return {
        hasChildDetails: false,
        fields: present([
          ["Organization", text(row["organization"])],
          ...who,
          [
            "Interested in",
            Array.isArray(row["interests"])
              ? (row["interests"] as unknown[]).map(text).join(", ")
              : "",
          ],
          ["Message", text(row["message"])],
        ]),
      };
    case "pledge":
      return {
        hasChildDetails: false,
        fields: present([
          ...who,
          ["Organization", text(row["organization"])],
          ["Sending from", text(row["origin_country"])],
          ["Shipping", text(row["shipping_plan"])],
          ["Expected", text(row["expected_date"])],
          ["Recognition", row["recognition_opt_in"] === true ? "Happy to be named publicly" : ""],
          ["Notes", text(row["notes"])],
        ]),
      };
  }
}

export async function getDetail(kind: InboxKind, reference: string): Promise<Result<Detail>> {
  const cfg = inboxKinds[kind];
  const found = await db().from(cfg.table).select("*").eq("reference", reference).limit(1);
  if (found.error) return failed("The record could not be loaded. Try again.");
  const row = rows(found.data)[0];
  if (!row) return failed("This record was not found, or your role does not allow you to see it.");

  let contact: { email: string; phone: string } | null = null;
  if (typeof row["contact_person_id"] === "string") {
    const person = await db()
      .from("contact_person")
      .select("email,phone")
      .eq("id", row["contact_person_id"])
      .limit(1);
    const first = rows(person.data)[0];
    if (first) contact = { email: text(first["email"]), phone: text(first["phone"]) };
  }
  let items: PledgeItem[] = [];
  if (kind === "pledge" && typeof row["id"] === "string") {
    const list = await db()
      .from("equipment_pledge_item")
      .select("description,quantity,condition")
      .eq("pledge_id", row["id"]);
    items = rows(list.data).map((item) => ({
      description: text(item["description"]),
      quantity: Number(item["quantity"]) || 0,
      condition: text(item["condition"]),
    }));
  }
  const { fields, hasChildDetails } = buildFields(kind, row, contact);
  return {
    ok: true,
    data: {
      kind,
      reference: text(row["reference"]),
      status: text(row["status"]),
      notes: text(row["internal_notes"]),
      createdAt: text(row["created_at"]),
      restricted: kind === "contact" && row["topic"] === "safeguarding",
      hasChildDetails,
      fields,
      items,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Working a record: status and notes only. The database refuses anything else and logs the change.
// ---------------------------------------------------------------------------------------------
export const NOTES_MAX = 4000;

export async function saveSubmission(
  kind: InboxKind,
  reference: string,
  input: { status: string; notes: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const cfg = inboxKinds[kind];
  if (!cfg.statuses.includes(input.status)) return failed("Choose a valid status.");
  if (input.notes.length > NOTES_MAX) return failed(`Notes can be up to ${NOTES_MAX} characters.`);
  const { data, error } = await db()
    .from(cfg.table)
    .update({
      status: input.status,
      internal_notes: input.notes.trim() === "" ? null : input.notes,
    })
    .eq("reference", reference)
    .select("reference");
  if (error) {
    return failed(
      error.code === "23514"
        ? "Notes are too long."
        : "Your changes could not be saved. Nothing was changed.",
    );
  }
  // The database refuses silently by returning no rows: say so plainly instead of pretending it worked.
  if (rows(data).length === 0) {
    return failed(
      "Your role does not allow you to change this record, or it no longer exists. Nothing was changed.",
    );
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// History and email status for one record
// ---------------------------------------------------------------------------------------------
export interface HistoryEntry {
  at: string;
  actor: string;
  description: string;
}
export interface EmailEntry {
  label: string;
  status: string;
  detail: string;
}

export function describeAudit(field: string, oldValue: string, newValue: string): string {
  if (field === "status") {
    return `changed the status from ${statusLabel(oldValue || "unknown")} to ${statusLabel(newValue || "unknown")}`;
  }
  if (field === "internal_notes") return "edited the notes";
  if (field === "owner_id") return "changed the owner";
  return `changed ${field}`;
}

const emailLabels: Record<string, string> = {
  staff_notification: "Staff notification",
  sender_confirmation: "Confirmation to the sender",
  safeguarding_alert: "Safeguarding alert",
};

export async function loadHistory(
  reference: string,
): Promise<Result<{ history: HistoryEntry[]; emails: EmailEntry[] }>> {
  const [audit, staff, emails] = await Promise.all([
    db()
      .from("audit_log")
      .select("field,old_value,new_value,created_at,actor_id")
      .eq("reference", reference)
      .order("created_at", { ascending: false })
      .limit(50),
    db().rpc("staff_directory"),
    db()
      .from("email_log")
      .select("template,status,error_code,sent_at,attempts")
      .eq("reference", reference)
      .order("created_at", { ascending: true }),
  ]);
  if (audit.error) return failed("The history could not be loaded.");
  const names = new Map(rows(staff.data).map((s) => [text(s["user_id"]), text(s["email"])]));
  const history = rows(audit.data).map((entry) => ({
    at: text(entry["created_at"]),
    actor:
      names.get(text(entry["actor_id"])) ?? (entry["actor_id"] ? "A staff member" : "The system"),
    description: describeAudit(
      text(entry["field"]),
      text(entry["old_value"]),
      text(entry["new_value"]),
    ),
  }));
  const emailEntries = rows(emails.data).map((email) => ({
    label: emailLabels[text(email["template"])] ?? text(email["template"]),
    status: text(email["status"]),
    detail:
      email["status"] === "sent"
        ? `sent ${text(email["sent_at"])}`
        : email["status"] === "failed"
          ? `not sent (${text(email["error_code"]) || "unknown reason"}); it will be retried`
          : "being sent",
  }));
  return { ok: true, data: { history, emails: emailEntries } };
}

// ---------------------------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------------------------
export interface KindCount {
  newCount: number;
  overdueCount: number;
}

export async function loadCounts(
  now: Date = new Date(),
): Promise<Record<InboxKind, KindCount | null>> {
  const kinds = Object.keys(inboxKinds) as InboxKind[];
  const entries = await Promise.all(
    kinds.map(async (kind) => {
      const cfg = inboxKinds[kind];
      const { data, error } = await db()
        .from(cfg.table)
        .select("status,created_at")
        .eq("status", cfg.newStatus)
        .limit(500);
      if (error) return [kind, null] as const;
      const list = rows(data);
      return [
        kind,
        {
          newCount: list.length,
          overdueCount: list.filter((row) =>
            isOverdue(text(row["status"]), text(row["created_at"]), cfg, now),
          ).length,
        },
      ] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<InboxKind, KindCount | null>;
}
