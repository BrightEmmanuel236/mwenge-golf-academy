import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  results: {} as Record<
    string,
    { data: unknown; error: { message: string; code?: string } | null; count?: number | null }
  >,
}));

vi.mock("@/integrations/supabase/client", () => {
  const make = (table: string) => {
    const ops: [string, unknown[]][] = [];
    state.calls.push({ table, ops });
    const builder: Record<string, unknown> = {};
    for (const name of ["select", "eq", "order", "range", "limit", "update"]) {
      builder[name] = (...args: unknown[]) => {
        ops.push([name, args]);
        return builder;
      };
    }
    builder["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(state.results[table] ?? { data: [], error: null }).then(resolve, reject);
    return builder;
  };
  return { supabase: { from: (t: string) => make(t), rpc: (n: string) => make(`rpc:${n}`) } };
});

import {
  buildFields,
  describeAudit,
  getDetail,
  kindFromSlug,
  kindSlugs,
  listSubmissions,
  loadCounts,
  loadHistory,
  NOTES_MAX,
  PAGE_SIZE,
  saveSubmission,
  toListRow,
} from "@/lib/admin/queries";

const ops = (table: string) => state.calls.filter((c) => c.table === table).at(-1)?.ops ?? [];
const op = (table: string, name: string) => ops(table).find(([n]) => n === name)?.[1];

beforeEach(() => {
  state.calls.length = 0;
  state.results = {};
});

describe("lists and addresses", () => {
  it("maps the four URL names to the four kinds and back", () => {
    for (const [kind, slug] of Object.entries(kindSlugs)) expect(kindFromSlug(slug)).toBe(kind);
    expect(kindFromSlug("nonsense")).toBeNull();
    expect(kindFromSlug("enquiry")).toBeNull(); // only the URL names are accepted
  });
  it("asks for newest first, one page at a time, with a total", async () => {
    state.results["enquiry"] = { data: [], error: null, count: 60 };
    const result = await listSubmissions("enquiry", { page: 2 });
    expect(result).toEqual({ ok: true, data: { rows: [], total: 60 } });
    expect(op("enquiry", "select")?.[1]).toEqual({ count: "exact" });
    expect(op("enquiry", "order")).toEqual(["created_at", { ascending: false }]);
    expect(op("enquiry", "range")).toEqual([2 * PAGE_SIZE, 3 * PAGE_SIZE - 1]);
  });
  it("filters by a real status only, ignoring anything else", async () => {
    await listSubmissions("contact", { status: "replied" });
    expect(op("contact_message", "eq")).toEqual(["status", "replied"]);
    state.calls.length = 0;
    await listSubmissions("contact", { status: "contacted'; drop table x" });
    expect(op("contact_message", "eq")).toBeUndefined();
  });
  it("treats a negative or fractional page as the first page", async () => {
    await listSubmissions("enquiry", { page: -3 });
    expect(op("enquiry", "range")).toEqual([0, PAGE_SIZE - 1]);
  });
  it("reports a database error without detail", async () => {
    state.results["enquiry"] = {
      data: null,
      error: { message: "secret internals", code: "XX000" },
    };
    const result = await listSubmissions("enquiry");
    expect(result).toEqual({ ok: false, message: "The list could not be loaded. Try again." });
  });
  it("summarises each kind and marks safeguarding reports as restricted", () => {
    expect(
      toListRow("enquiry", {
        reference: "R",
        status: "new",
        created_at: "t",
        submitted_name: "A",
        audience: "junior",
        program_slug: "p",
      }).summary,
    ).toBe("junior · p");
    expect(toListRow("sponsor", { organization: "Acme" }).summary).toBe("Acme");
    expect(toListRow("pledge", { origin_country: "Kenya" }).summary).toBe("Kenya");
    expect(toListRow("contact", { topic: "media" }).restricted).toBe(false);
    expect(toListRow("contact", { topic: "safeguarding" }).restricted).toBe(true);
  });
});

describe("what staff see on a record", () => {
  const junior = {
    submitted_name: "Pat",
    submitted_phone: "+256700",
    audience: "junior",
    message: "Hi",
    guardian_relationship: "Mother",
    child_first_name: "Kai",
    child_age: 9,
    guardian_declaration: true,
  };
  it("includes a child's details only for a junior enquiry", () => {
    const a = buildFields("enquiry", junior, { email: "pat@example.org", phone: "" });
    expect(a.hasChildDetails).toBe(true);
    expect(a.fields.map((f) => f.label)).toEqual(
      expect.arrayContaining(["Child's first name", "Child's age", "Guardian declaration"]),
    );
    const b = buildFields(
      "enquiry",
      { ...junior, audience: "adult" },
      { email: "x@y.org", phone: "" },
    );
    expect(b.hasChildDetails).toBe(false);
    expect(JSON.stringify(b.fields)).not.toMatch(/Kai|Child/);
  });
  it("shows the email from the contact record, or from the report for safeguarding", () => {
    expect(
      buildFields(
        "contact",
        { submitted_name: "M", message: "m", topic: "media" },
        { email: "m@x.org", phone: "" },
      ).fields,
    ).toContainEqual({ label: "Email", value: "m@x.org" });
    expect(
      buildFields(
        "contact",
        {
          submitted_name: "Anonymous",
          submitted_email: "r@x.org",
          message: "m",
          topic: "safeguarding",
        },
        null,
      ).fields,
    ).toContainEqual({ label: "Email", value: "r@x.org" });
  });
  it("leaves out empty fields rather than showing blanks", () => {
    const labels = buildFields(
      "contact",
      { submitted_name: "M", message: "m", topic: "other" },
      null,
    ).fields.map((f) => f.label);
    expect(labels).not.toContain("Email");
    expect(labels).not.toContain("Phone");
  });
  it("loads the record, its contact person and (for pledges) its items", async () => {
    state.results["equipment_pledge"] = {
      data: [
        {
          id: "p1",
          reference: "MGA-PLG-1",
          status: "submitted",
          created_at: "t",
          submitted_name: "Pru",
          contact_person_id: "c1",
          origin_country: "Kenya",
          internal_notes: "n",
        },
      ],
      error: null,
    };
    state.results["contact_person"] = { data: [{ email: "pru@x.org", phone: "+1" }], error: null };
    state.results["equipment_pledge_item"] = {
      data: [{ description: "Irons", quantity: 4, condition: "good" }],
      error: null,
    };
    const result = await getDetail("pledge", "MGA-PLG-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toEqual([{ description: "Irons", quantity: 4, condition: "good" }]);
    expect(result.data.notes).toBe("n");
    expect(result.data.fields).toContainEqual({ label: "Email", value: "pru@x.org" });
    expect(op("contact_person", "eq")).toEqual(["id", "c1"]);
    expect(op("equipment_pledge_item", "eq")).toEqual(["pledge_id", "p1"]);
  });
  it("says 'not found or not allowed' without revealing which", async () => {
    state.results["enquiry"] = { data: [], error: null };
    const result = await getDetail("enquiry", "MGA-ENQ-0");
    expect(result).toEqual({
      ok: false,
      message: "This record was not found, or your role does not allow you to see it.",
    });
  });
});

describe("saving", () => {
  it("rejects an invalid status or over-long notes before calling the database", async () => {
    expect(await saveSubmission("enquiry", "R", { status: "hacked", notes: "" })).toEqual({
      ok: false,
      message: "Choose a valid status.",
    });
    expect(
      (await saveSubmission("enquiry", "R", { status: "closed", notes: "x".repeat(NOTES_MAX + 1) }))
        .ok,
    ).toBe(false);
    expect(state.calls).toHaveLength(0);
  });
  it("sends only the status and notes, for that reference, and asks for the changed row back", async () => {
    state.results["enquiry"] = { data: [{ reference: "R" }], error: null };
    expect(await saveSubmission("enquiry", "R", { status: "contacted", notes: "Called" })).toEqual({
      ok: true,
    });
    expect(op("enquiry", "update")).toEqual([{ status: "contacted", internal_notes: "Called" }]);
    expect(op("enquiry", "eq")).toEqual(["reference", "R"]);
    expect(op("enquiry", "select")).toEqual(["reference"]);
  });
  it("stores empty notes as nothing", async () => {
    state.results["enquiry"] = { data: [{ reference: "R" }], error: null };
    await saveSubmission("enquiry", "R", { status: "new", notes: "   " });
    expect(op("enquiry", "update")).toEqual([{ status: "new", internal_notes: null }]);
  });
  it("does not claim success when the database changed nothing (the role is not allowed)", async () => {
    state.results["enquiry"] = { data: [], error: null };
    const result = await saveSubmission("enquiry", "R", { status: "closed", notes: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Nothing was changed/);
  });
  it("reports errors plainly without database text", async () => {
    state.results["enquiry"] = {
      data: null,
      error: { message: "violates something internal", code: "42501" },
    };
    const result = await saveSubmission("enquiry", "R", { status: "closed", notes: "" });
    expect(result).toEqual({
      ok: false,
      message: "Your changes could not be saved. Nothing was changed.",
    });
    state.results["enquiry"] = { data: null, error: { message: "x", code: "23514" } };
    expect(await saveSubmission("enquiry", "R", { status: "closed", notes: "" })).toEqual({
      ok: false,
      message: "Notes are too long.",
    });
  });
});

describe("history and counts", () => {
  it("describes changes without ever showing note text", () => {
    expect(describeAudit("status", "new", "contacted")).toBe(
      "changed the status from New to Contacted",
    );
    expect(describeAudit("internal_notes", "", "(notes edited)")).toBe("edited the notes");
    expect(describeAudit("owner_id", "a", "b")).toBe("changed the owner");
  });
  it("names the staff member who made each change, and the emails sent", async () => {
    state.results["audit_log"] = {
      data: [
        {
          field: "status",
          old_value: "new",
          new_value: "closed",
          created_at: "2026-11-05T09:00:00Z",
          actor_id: "u1",
        },
        { field: "status", old_value: "a", new_value: "b", created_at: "t", actor_id: "u2" },
      ],
      error: null,
    };
    state.results["rpc:staff_directory"] = {
      data: [{ user_id: "u1", email: "ops@academy.org" }],
      error: null,
    };
    state.results["email_log"] = {
      data: [
        { template: "staff_notification", status: "sent", sent_at: "t" },
        { template: "sender_confirmation", status: "failed", error_code: "http_500" },
      ],
      error: null,
    };
    const result = await loadHistory("MGA-ENQ-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.history[0]).toMatchObject({
      actor: "ops@academy.org",
      description: "changed the status from New to Closed",
    });
    expect(result.data.history[1]?.actor).toBe("A staff member");
    expect(result.data.emails[0]).toMatchObject({ label: "Staff notification", status: "sent" });
    expect(result.data.emails[1]?.detail).toContain("will be retried");
  });
  it("counts new and overdue per kind (2 business days, Kampala time)", async () => {
    const monday = "2026-11-02T07:00:00Z";
    state.results["enquiry"] = {
      data: [
        { status: "new", created_at: monday },
        { status: "new", created_at: "2026-11-05T07:00:00Z" },
      ],
      error: null,
    };
    state.results["contact_message"] = { data: [], error: { message: "x" } };
    const counts = await loadCounts(new Date("2026-11-05T12:00:00Z")); // Thursday
    expect(counts.enquiry).toEqual({ newCount: 2, overdueCount: 1 });
    expect(counts.contact).toBeNull();
    expect(counts.pledge).toEqual({ newCount: 0, overdueCount: 0 });
    expect(op("enquiry", "eq")).toEqual(["status", "new"]);
    expect(op("equipment_pledge", "eq")).toEqual(["status", "submitted"]);
  });
});
