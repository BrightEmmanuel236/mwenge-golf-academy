import { describe, expect, it, vi } from "vitest";
import {
  clientIpFrom,
  processSubmission,
  sha256Hex,
  type SubmitDeps,
} from "@/lib/server/submit.server";

type RpcCall = { name: string; args: Record<string, unknown> };

function setup(overrides: Partial<SubmitDeps> & { saveError?: boolean; throttle?: unknown } = {}) {
  const calls: RpcCall[] = [];
  const logs: string[] = [];
  const deps: SubmitDeps = {
    env: { FORMS_SAVING_ENABLED: "true", THROTTLE_PEPPER: "test-pepper" },
    ip: "203.0.113.7",
    log: (message) => logs.push(message),
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === "check_and_record_throttle") {
        return overrides.throttle === undefined
          ? { data: true, error: null }
          : (overrides.throttle as { data: unknown; error: null });
      }
      return overrides.saveError
        ? { data: null, error: { code: "23514" } }
        : { data: "MGA-TEST-2026-0001", error: null };
    },
    ...overrides,
  };
  return { deps, calls, logs };
}

const contact = {
  name: "Ada Test",
  email: "Ada@Example.com",
  topic: "training",
  message: "Hello there",
  website: "",
};
const adultEnquiry = {
  audience: "adult",
  name: "Ada",
  email: "ada@example.com",
  phone: "+256700000001",
  message: "Hi",
};

describe("processSubmission: switches and input", () => {
  it("does nothing and says so when saving is not switched on", async () => {
    const { deps, calls } = setup({ env: { THROTTLE_PEPPER: "x" } });
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toMatchObject({ ok: false, reason: "disabled" });
    expect(calls).toHaveLength(0);
  });

  it("rejects an unknown kind without touching the database", async () => {
    const { deps, calls } = setup();
    expect(await processSubmission({ kind: "donation", data: {} }, deps)).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(await processSubmission(null, deps)).toMatchObject({ ok: false, reason: "invalid" });
    expect(calls).toHaveLength(0);
  });

  it("rejects a filled honeypot with no record and no throttle entry", async () => {
    const { deps, calls } = setup();
    const result = await processSubmission(
      { kind: "contact", data: { ...contact, website: "http://spam.example" } },
      deps,
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    // A person whose browser autofilled the hidden field must get a readable message, not schema jargon.
    if (!result.ok)
      expect(result.fieldErrors?.["website"]).toMatch(/reload the page and try again/i);
    expect(calls).toHaveLength(0);
  });

  it("returns field errors keyed like the form, including nested pledge items", async () => {
    const { deps, calls } = setup();
    const result = await processSubmission(
      {
        kind: "pledge",
        data: {
          name: "C",
          email: "c@example.com",
          originCountry: "UK",
          shippingPlan: "undecided",
          items: [{ description: "", quantity: 1, condition: "good" }],
        },
      },
      deps,
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    if (!result.ok) expect(Object.keys(result.fieldErrors ?? {})).toContain("items.0.description");
    expect(calls).toHaveLength(0);
  });

  it("enforces the junior guardian rule again on the server (AC-E2)", async () => {
    const { deps, calls } = setup();
    const result = await processSubmission(
      {
        kind: "enquiry",
        data: {
          ...adultEnquiry,
          audience: "junior",
          guardianRelationship: "Parent",
          childFirstName: "Kid",
          childAge: 9,
          guardianDeclaration: false,
        },
      },
      deps,
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(calls).toHaveLength(0);
  });
});

describe("processSubmission: rate limit and storage", () => {
  it("refuses to save when the throttle salt is missing (fails closed)", async () => {
    const { deps, calls, logs } = setup({ env: { FORMS_SAVING_ENABLED: "true" } });
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
    expect(calls).toHaveLength(0);
    expect(logs.join(" ")).toContain("THROTTLE_PEPPER");
  });

  it("stops at the rate limit without saving", async () => {
    const { deps, calls } = setup({ throttle: { data: false, error: null } });
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toMatchObject({ ok: false, reason: "rate_limited" });
    expect(calls.map((c) => c.name)).toEqual(["check_and_record_throttle"]);
  });

  it("treats a failed throttle check as not saved", async () => {
    const { deps, calls } = setup({ throttle: { data: null, error: { code: "XX000" } } });
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
    expect(calls).toHaveLength(1);
  });

  it("saves in order (throttle, then save) and returns the database's reference", async () => {
    const { deps, calls } = setup();
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toEqual({ ok: true, reference: "MGA-TEST-2026-0001" });
    expect(calls.map((c) => c.name)).toEqual([
      "check_and_record_throttle",
      "submit_contact_message",
    ]);
  });

  it("sends the cleaned payload: trimmed, lower-cased email, no honeypot field", async () => {
    const { deps, calls } = setup();
    await processSubmission({ kind: "contact", data: contact }, deps);
    const payload = calls[1]?.args["p"] as Record<string, unknown>;
    expect(payload["email"]).toBe("ada@example.com");
    expect(payload).not.toHaveProperty("website");
    expect(payload["topic"]).toBe("training");
  });

  it.each([
    ["enquiry", adultEnquiry, "submit_enquiry"],
    [
      "sponsor",
      {
        organization: "Acme",
        name: "Bo",
        email: "bo@example.com",
        interests: ["other"],
        message: "Hi",
      },
      "submit_sponsor_enquiry",
    ],
    [
      "pledge",
      {
        name: "Cy",
        email: "cy@example.com",
        originCountry: "UK",
        shippingPlan: "undecided",
        items: [{ description: "Clubs", quantity: 2, condition: "good" }],
      },
      "submit_equipment_pledge",
    ],
  ])("routes a %s to %s", async (kind, data, rpcName) => {
    const { deps, calls } = setup();
    const result = await processSubmission({ kind, data }, deps);
    expect(result.ok).toBe(true);
    expect(calls[1]?.name).toBe(rpcName);
  });

  it("never tells a visitor it saved when the database failed, and logs only the code", async () => {
    const { deps, logs } = setup({ saveError: true });
    const result = await processSubmission({ kind: "contact", data: contact }, deps);
    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
    if (!result.ok) expect(result.message).toMatch(/nothing was sent/i);
    const logged = logs.join(" ");
    expect(logged).toContain("23514");
    expect(logged).not.toContain("ada@example.com");
    expect(logged).not.toContain("Hello there");
  });

  it("rejects a database reply that has no reference as not saved", async () => {
    const { deps } = setup({
      rpc: async (name) =>
        name === "check_and_record_throttle"
          ? { data: true, error: null }
          : { data: null, error: null },
    });
    expect(await processSubmission({ kind: "contact", data: contact }, deps)).toMatchObject({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("throttle keys", () => {
  it("sends only 64-character salted hashes, never the raw email or IP", async () => {
    const { deps, calls } = setup();
    await processSubmission({ kind: "contact", data: contact }, deps);
    const args = calls[0]?.args as { _email_hash: string; _ip_hash: string };
    expect(args._email_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(args._ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(calls[0])).not.toContain("ada@example.com");
    expect(JSON.stringify(calls[0])).not.toContain("203.0.113.7");
  });

  it("gives the same email the same key, so the per-email limit works", async () => {
    const a = setup();
    const b = setup({ ip: "198.51.100.9" });
    await processSubmission({ kind: "contact", data: contact }, a.deps);
    await processSubmission({ kind: "contact", data: contact }, b.deps);
    expect((a.calls[0]?.args as Record<string, string>)["_email_hash"]).toBe(
      (b.calls[0]?.args as Record<string, string>)["_email_hash"],
    );
  });

  it("uses a one-off IP key when the host gives no IP, so nobody is locked out together", async () => {
    const a = setup({ ip: null });
    const b = setup({ ip: null });
    await processSubmission({ kind: "contact", data: contact }, a.deps);
    await processSubmission({ kind: "contact", data: contact }, b.deps);
    expect((a.calls[0]?.args as Record<string, string>)["_ip_hash"]).not.toBe(
      (b.calls[0]?.args as Record<string, string>)["_ip_hash"],
    );
  });

  it("hashes with SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("clientIpFrom", () => {
  const headers = (map: Record<string, string>) => (name: string) => map[name];
  it("prefers the host-set header, then the first forwarded address", () => {
    expect(
      clientIpFrom(headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9" })),
    ).toBe("1.1.1.1");
    expect(clientIpFrom(headers({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9" }))).toBe(
      "2.2.2.2",
    );
    expect(clientIpFrom(headers({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" }))).toBe("3.3.3.3");
    expect(clientIpFrom(headers({}))).toBeNull();
  });
});

vi.stubGlobal("crypto", globalThis.crypto);
