import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  isEmailAddress,
  parseAddressList,
  readEmailConfig,
  sendEmail,
  type EmailConfig,
  type EmailMessage,
  type SendResult,
} from "@/lib/server/email.server";
import { buildEmail, escapeHtml, type SubmissionData } from "@/lib/server/email-templates";
import {
  notifySubmission,
  retryFailedEmails,
  sendTemplate,
  type NotifyDeps,
} from "@/lib/server/notify.server";
import { handleEmailRetry, safeEqual } from "@/lib/server/email-retry.server";
import { processSafeguarding, type SafeguardingDeps } from "@/lib/server/safeguarding.server";
import { processSubmission, type SubmitDeps } from "@/lib/server/submit.server";

const ENV = {
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Mwenge Golf Academy <notify@example.org>",
  STAFF_NOTIFY_EMAILS: "Staff.One@Example.org, staff.two@example.org",
  SAFEGUARDING_EMAILS: "lead@example.org",
  ACADEMY_REPLY_TO: "hello@example.org",
  THROTTLE_PEPPER: "pepper",
  FORMS_SAVING_ENABLED: "true",
  SAFEGUARDING_INTAKE_ENABLED: "true",
  CRON_SECRET: "a-long-random-secret-value",
};

const enquiry: SubmissionData = {
  kind: "enquiry",
  reference: "MGA-ENQ-2026-0001",
  created_at: "2026-11-04T09:30:00Z",
  name: "Pat Parent",
  email: "pat@example.com",
  phone: "+256700000001",
  message: "Please enrol <b>my</b> child",
  audience: "junior",
  program_slug: "junior-academy",
  is_junior: true,
  guardian_relationship: "Mother",
};

/** A stand-in for the database's email functions, following the same claim rules. */
function fakeDb(data: Record<string, SubmissionData | null>) {
  const log = new Map<string, { status: string; attempts: number }>();
  const calls: string[] = [];
  const rpc: NotifyDeps["rpc"] = async (name, args) => {
    calls.push(name);
    const key = `${args["_reference"]}|${args["_template"]}`;
    if (name === "claim_email") {
      const row = log.get(key);
      if (!row) {
        log.set(key, { status: "pending", attempts: 1 });
        return { data: true, error: null };
      }
      if (row.status === "failed" && row.attempts < 5) {
        row.status = "pending";
        row.attempts += 1;
        return { data: true, error: null };
      }
      return { data: false, error: null };
    }
    if (name === "finish_email") {
      const row = log.get(key)!;
      row.status = args["_ok"] ? "sent" : "failed";
      if (!args["_ok"] && ["not_configured", "no_recipients"].includes(String(args["_error_code"])))
        row.attempts -= 1;
      (row as Record<string, unknown>)["code"] = args["_error_code"];
      return { data: null, error: null };
    }
    if (name === "get_submission_for_email")
      return { data: data[String(args["_reference"])] ?? null, error: null };
    if (name === "list_emails_to_retry") {
      const rows = [...log.entries()]
        .filter(([, r]) => r.status === "failed" && r.attempts < 5)
        .map(([k]) => {
          const [reference, template] = k.split("|");
          return { reference, template };
        });
      return { data: rows, error: null };
    }
    return { data: null, error: null };
  };
  return { rpc, log, calls };
}

function setup(
  over: {
    env?: Record<string, string | undefined>;
    sends?: SendResult[];
    data?: Record<string, SubmissionData | null>;
  } = {},
) {
  const sent: EmailMessage[] = [];
  const logs: string[] = [];
  const db = fakeDb(over.data ?? { [enquiry.reference]: enquiry });
  const queue = [...(over.sends ?? [])];
  const deps: NotifyDeps = {
    rpc: db.rpc,
    env: over.env ?? ENV,
    log: (m) => logs.push(m),
    send: async (_c: EmailConfig, message: EmailMessage) => {
      sent.push(message);
      return queue.shift() ?? { ok: true, id: `id-${sent.length}` };
    },
  };
  return { deps, sent, logs, db };
}

describe("addresses and configuration", () => {
  it("parses lists, lower-cases, de-duplicates and drops invalid entries", () => {
    expect(parseAddressList("A@x.org, b@y.org; a@X.org\n not-an-address, c@z.org")).toEqual([
      "a@x.org",
      "b@y.org",
      "c@z.org",
    ]);
    expect(parseAddressList(undefined)).toEqual([]);
    expect(parseAddressList("")).toEqual([]);
  });
  it("rejects addresses that could carry header injection or extra recipients", () => {
    for (const bad of [
      "a@x.org\nbcc:evil@x.org",
      "a@x.org, b@y.org",
      "Name <a@x.org>",
      "a b@x.org",
      "a@x",
      "",
    ]) {
      expect(isEmailAddress(bad), bad).toBe(false);
    }
  });
  it("is unconfigured without a key or a sender", () => {
    expect(readEmailConfig({})).toBeNull();
    expect(readEmailConfig({ RESEND_API_KEY: "k" })).toBeNull();
    expect(readEmailConfig({ EMAIL_FROM: "a@x.org" })).toBeNull();
    expect(readEmailConfig(ENV)?.apiUrl).toBe("https://api.resend.com/emails");
  });
  it("only lets the provider address be overridden to a local test server", () => {
    expect(
      readEmailConfig({ ...ENV, RESEND_API_URL: "http://127.0.0.1:9999/emails" })?.apiUrl,
    ).toBe("http://127.0.0.1:9999/emails");
    expect(
      readEmailConfig({ ...ENV, RESEND_API_URL: "https://evil.example/collect" })?.apiUrl,
    ).toBe("https://api.resend.com/emails");
  });
});

describe("sendEmail", () => {
  const config: EmailConfig = {
    apiKey: "re_k",
    from: "A <a@x.org>",
    apiUrl: "https://api.resend.com/emails",
  };
  const message: EmailMessage = {
    to: ["t@x.org"],
    subject: "S",
    text: "T",
    html: "<p>T</p>",
    replyTo: "r@x.org",
  };

  it("posts the expected request and returns the provider id", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const result = await sendEmail(config, message, (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ id: "abc123" }), { status: 200 });
    }) as unknown as typeof fetch);
    expect(result).toEqual({ ok: true, id: "abc123" });
    expect(seen?.url).toBe(config.apiUrl);
    const headers = seen?.init.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer re_k");
    expect(JSON.parse(String(seen?.init.body))).toEqual({
      from: config.from,
      to: ["t@x.org"],
      subject: "S",
      text: "T",
      html: "<p>T</p>",
      reply_to: "r@x.org",
    });
  });
  it("omits reply_to when there is none", async () => {
    let body: Record<string, unknown> = {};
    await sendEmail(config, { ...message, replyTo: undefined }, (async (
      _u: string,
      init: RequestInit,
    ) => {
      body = JSON.parse(String(init.body));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch);
    expect(body).not.toHaveProperty("reply_to");
  });
  it("maps provider and network failures to short codes without leaking text", async () => {
    expect(
      await sendEmail(
        config,
        message,
        (async () => new Response("secret detail", { status: 403 })) as unknown as typeof fetch,
      ),
    ).toEqual({ ok: false, code: "http_403" });
    expect(
      await sendEmail(config, message, (async () => {
        throw new Error("socket hang up with secret");
      }) as unknown as typeof fetch),
    ).toEqual({ ok: false, code: "network" });
    const aborted = await sendEmail(config, message, (async () => {
      const e = new Error("x");
      e.name = "AbortError";
      throw e;
    }) as unknown as typeof fetch);
    expect(aborted).toEqual({ ok: false, code: "timeout" });
  });
});

describe("templates", () => {
  it("never puts anything the sender typed in a subject line", () => {
    const hostile = { ...enquiry, name: "Evil\r\nBcc: x@evil.test", message: "Subject: injected" };
    for (const t of ["staff_notification", "sender_confirmation"] as const) {
      const { subject } = buildEmail(t, hostile);
      expect(subject).not.toMatch(/Evil|Bcc|injected/);
      expect(subject).not.toMatch(/[\r\n]/);
      expect(subject).toContain("MGA-ENQ-2026-0001");
    }
  });
  it("escapes HTML in every field of the HTML part", () => {
    const { html, text } = buildEmail("staff_notification", {
      ...enquiry,
      name: "<script>x</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;my&lt;/b&gt;");
    expect(text).toContain("<b>my</b>"); // plain text stays literal
    expect(escapeHtml(`"&'<>`)).toBe("&quot;&amp;&#39;&lt;&gt;");
  });
  it("carries no child details and says so for junior enquiries", () => {
    const { text, html } = buildEmail("staff_notification", {
      ...enquiry,
      child_first_name: "Kai",
      child_age: 9,
    } as SubmissionData);
    expect(text + html).not.toMatch(/Kai|child_age|\b9\b/);
    expect(text).toContain("Details about the child are not included in email");
    expect(text).toContain("Guardian relationship: Mother");
  });
  it("gives the sender a confirmation with the reference and no promises or message text", () => {
    const { subject, text } = buildEmail("sender_confirmation", enquiry);
    expect(subject).toBe("We received your enquiry: MGA-ENQ-2026-0001");
    expect(text).toContain("MGA-ENQ-2026-0001");
    expect(text).not.toMatch(/within|hours|days|guarantee/i);
    expect(text).not.toContain("Please enrol");
  });
  it("formats the time in Kampala", () => {
    expect(buildEmail("staff_notification", enquiry).text).toMatch(
      /Received: 4 Nov 2026, 12:30 \(Kampala time\)/,
    );
  });
  it("lists pledge items and sponsor interests", () => {
    const pledge = buildEmail("staff_notification", {
      kind: "pledge",
      reference: "MGA-PLG-1",
      created_at: enquiry.created_at,
      name: "P",
      items: [{ description: "Irons", quantity: 4, condition: "good" }],
      origin_country: "Kenya",
    });
    expect(pledge.text).toContain("4 x Irons (good)");
    const sponsor = buildEmail("staff_notification", {
      kind: "sponsor",
      reference: "MGA-SPN-1",
      created_at: enquiry.created_at,
      name: "S",
      interests: ["a", "b"],
      organization: "Acme",
    });
    expect(sponsor.text).toContain("Interested in: a, b");
  });
  it("marks the safeguarding alert and keeps the message", () => {
    const alert = buildEmail("safeguarding_alert", {
      kind: "safeguarding",
      reference: "MGA-SGD-1",
      created_at: enquiry.created_at,
      name: "Anonymous",
      message: "A concern",
    });
    expect(alert.subject).toBe("Safeguarding concern received: MGA-SGD-1");
    expect(alert.text).toContain("A concern");
    expect(alert.text).toContain("only to the safeguarding contacts");
  });
});

describe("sending for a saved submission", () => {
  it("sends the staff notification (to the staff list, reply-to the sender) and the sender confirmation", async () => {
    const { deps, sent } = setup();
    const outcome = await notifySubmission(enquiry.reference, "enquiry", deps);
    expect(outcome).toEqual({ staff_notification: "sent", sender_confirmation: "sent" });
    const staff = sent.find((m) => m.subject.startsWith("New enquiry"))!;
    expect(staff.to).toEqual(["staff.one@example.org", "staff.two@example.org"]);
    expect(staff.replyTo).toBe("pat@example.com");
    const confirmation = sent.find((m) => m.subject.startsWith("We received"))!;
    expect(confirmation.to).toEqual(["pat@example.com"]);
    expect(confirmation.replyTo).toBe("hello@example.org");
  });
  it("never sends the same email twice", async () => {
    const { deps, sent } = setup();
    await notifySubmission(enquiry.reference, "enquiry", deps);
    const again = await notifySubmission(enquiry.reference, "enquiry", deps);
    expect(again).toEqual({ staff_notification: "skipped", sender_confirmation: "skipped" });
    expect(sent).toHaveLength(2);
  });
  it("records a provider failure, keeps going, and logs only the code", async () => {
    const { deps, sent, logs, db } = setup({ sends: [{ ok: false, code: "http_500" }] });
    const outcome = await notifySubmission(enquiry.reference, "enquiry", deps);
    expect(Object.values(outcome).sort()).toEqual(["failed", "sent"]);
    expect(sent).toHaveLength(2);
    expect(logs.join(" ")).toContain("http_500");
    expect(logs.join(" ")).not.toContain("pat@example.com");
    expect([...db.log.values()].some((r) => r.status === "failed")).toBe(true);
  });
  it("records 'not_configured' without using up retries, and nothing is sent", async () => {
    const { deps, sent, db } = setup({ env: { ...ENV, RESEND_API_KEY: undefined } });
    const outcome = await sendTemplate(enquiry.reference, "staff_notification", deps);
    expect(outcome).toBe("failed");
    expect(sent).toHaveLength(0);
    const row = [...db.log.values()][0] as unknown as { attempts: number; code: string };
    expect(row.code).toBe("not_configured");
    expect(row.attempts).toBe(0);
  });
  it("records 'no_recipients' when no staff address is set", async () => {
    const { deps, db } = setup({ env: { ...ENV, STAFF_NOTIFY_EMAILS: "bad, entries" } });
    expect(await sendTemplate(enquiry.reference, "staff_notification", deps)).toBe("failed");
    expect(([...db.log.values()][0] as unknown as { code: string }).code).toBe("no_recipients");
  });
  it("records a failed load when the submission cannot be read, and sends nothing", async () => {
    const { deps, sent, db } = setup({ data: {} });
    expect(await sendTemplate(enquiry.reference, "staff_notification", deps)).toBe("failed");
    expect(sent).toHaveLength(0);
    expect(([...db.log.values()][0] as unknown as { code: string }).code).toBe("load_failed");
  });
  it("survives the database and the provider throwing", async () => {
    const throwing: NotifyDeps = {
      env: ENV,
      rpc: async () => {
        throw new Error("db down");
      },
      log: () => undefined,
    };
    await expect(notifySubmission(enquiry.reference, "enquiry", throwing)).resolves.toBeTruthy();
  });
  it("keeps safeguarding separate in both directions", async () => {
    const sg: SubmissionData = {
      kind: "safeguarding",
      reference: "MGA-SGD-2026-0001",
      created_at: enquiry.created_at,
      name: "Anonymous",
      message: "Concern",
      email: null,
    };
    const { deps, sent } = setup({ data: { [sg.reference]: sg, [enquiry.reference]: enquiry } });
    // A concern goes only to the safeguarding list.
    expect(await notifySubmission(sg.reference, "safeguarding", deps)).toEqual({
      safeguarding_alert: "sent",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["lead@example.org"]);
    // Even if asked directly, it never produces a general email...
    expect(await sendTemplate(sg.reference, "staff_notification", deps)).toBe("failed");
    expect(await sendTemplate(sg.reference, "sender_confirmation", deps)).toBe("failed");
    // ...and an ordinary submission never produces a safeguarding alert.
    expect(await sendTemplate(enquiry.reference, "safeguarding_alert", deps)).toBe("failed");
    expect(sent).toHaveLength(1);
  });
});

describe("retry", () => {
  it("sends emails that failed, and not ones already sent", async () => {
    const { deps, sent, db } = setup({
      sends: [
        { ok: false, code: "http_500" },
        { ok: false, code: "http_500" },
      ],
    });
    await notifySubmission(enquiry.reference, "enquiry", deps); // both fail
    expect(sent).toHaveLength(2);
    const summary = await retryFailedEmails(deps);
    expect(summary).toEqual({ attempted: 2, sent: 2, failed: 0, skipped: 0 });
    expect(sent).toHaveLength(4);
    expect([...db.log.values()].every((r) => r.status === "sent")).toBe(true);
    expect((await retryFailedEmails(deps)).attempted).toBe(0);
  });
  it("ignores entries it does not recognise", async () => {
    const deps: NotifyDeps = {
      env: ENV,
      rpc: async () => ({
        data: [
          { reference: "X", template: "evil" },
          { reference: 5, template: "staff_notification" },
        ],
        error: null,
      }),
    };
    expect(await retryFailedEmails(deps)).toEqual({ attempted: 0, sent: 0, failed: 0, skipped: 0 });
  });
  it("reports a failed list as nothing attempted", async () => {
    const logs: string[] = [];
    const deps: NotifyDeps = {
      env: ENV,
      log: (m) => logs.push(m),
      rpc: async () => ({ data: null, error: { code: "XX000" } }),
    };
    expect(await retryFailedEmails(deps)).toEqual({ attempted: 0, sent: 0, failed: 0, skipped: 0 });
    expect(logs.join(" ")).toContain("XX000");
  });
});

describe("retry endpoint", () => {
  const req = (auth?: string, method = "GET") =>
    new Request("https://x.test/api/email-retry", {
      method,
      headers: auth ? { authorization: auth } : {},
    });
  it("does not exist without a strong secret", async () => {
    const { deps } = setup({ env: { ...ENV, CRON_SECRET: undefined } });
    expect((await handleEmailRetry(req("Bearer anything"), deps)).status).toBe(404);
    expect(
      (
        await handleEmailRetry(
          req("Bearer short"),
          setup({ env: { ...ENV, CRON_SECRET: "short" } }).deps,
        )
      ).status,
    ).toBe(404);
  });
  it("rejects a missing or wrong token", async () => {
    const { deps } = setup();
    expect((await handleEmailRetry(req(), deps)).status).toBe(401);
    expect((await handleEmailRetry(req("Bearer wrong-wrong-wrong-wrong"), deps)).status).toBe(401);
    expect((await handleEmailRetry(req(ENV.CRON_SECRET), deps)).status).toBe(401); // no "Bearer "
  });
  it("runs the retry with the right token (GET or POST) and returns only counts", async () => {
    const { deps } = setup();
    for (const method of ["GET", "POST"]) {
      const res = await handleEmailRetry(req(`Bearer ${ENV.CRON_SECRET}`, method), deps);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ attempted: 0, sent: 0, failed: 0, skipped: 0 });
    }
  });
  it("compares secrets without short-circuiting", async () => {
    expect(await safeEqual("same", "same")).toBe(true);
    expect(await safeEqual("same", "sam")).toBe(false);
    expect(await safeEqual("", "x")).toBe(false);
  });
});

describe("submission flow sends emails after saving, and only then", () => {
  const contact = {
    name: "Ada",
    email: "ada@example.com",
    topic: "media",
    message: "Hello",
    website: "",
  };
  function flow(notify: SubmitDeps["notify"], over: Partial<SubmitDeps> = {}) {
    const deps: SubmitDeps = {
      env: ENV,
      ip: "203.0.113.1",
      log: () => undefined,
      notify,
      rpc: async (name) =>
        name === "check_and_record_throttle"
          ? { data: true, error: null }
          : { data: "MGA-MSG-2026-0001", error: null },
      ...over,
    };
    return deps;
  }
  it("calls notify with the kind and reference after a successful save", async () => {
    const seen: unknown[] = [];
    const result = await processSubmission(
      { kind: "contact", data: contact },
      flow(async (k, r) => {
        seen.push([k, r]);
      }),
    );
    expect(result).toEqual({ ok: true, reference: "MGA-MSG-2026-0001" });
    expect(seen).toEqual([["contact", "MGA-MSG-2026-0001"]]);
  });
  it("does not change the result when sending emails throws", async () => {
    const result = await processSubmission(
      { kind: "contact", data: contact },
      flow(async () => {
        throw new Error("provider down");
      }),
    );
    expect(result).toEqual({ ok: true, reference: "MGA-MSG-2026-0001" });
  });
  it("does not send anything when the save failed or was refused", async () => {
    let calls = 0;
    const notify = async () => {
      calls += 1;
    };
    await processSubmission(
      { kind: "contact", data: contact },
      flow(notify, {
        rpc: async (n) =>
          n === "check_and_record_throttle"
            ? { data: true, error: null }
            : { data: null, error: { code: "23514" } },
      }),
    );
    await processSubmission(
      { kind: "contact", data: contact },
      flow(notify, { rpc: async () => ({ data: false, error: null }) }),
    );
    await processSubmission(
      { kind: "contact", data: { ...contact, website: "spam" } },
      flow(notify),
    );
    expect(calls).toBe(0);
  });
});

describe("safeguarding intake", () => {
  const concern = { name: "", email: "", message: "I am worried about a child", website: "" };
  function sg(over: Partial<SafeguardingDeps> = {}, calls: string[] = []) {
    const deps: SafeguardingDeps = {
      env: ENV,
      ip: "203.0.113.1",
      log: () => undefined,
      alert: async () => true,
      rpc: async (name, args) => {
        calls.push(
          name + (name === "submit_safeguarding_concern" ? JSON.stringify(args["p"]) : ""),
        );
        return name === "check_and_record_throttle"
          ? { data: true, error: null }
          : { data: "MGA-SGD-2026-0001", error: null };
      },
      ...over,
    };
    return deps;
  }
  it("is off unless switched on, a safeguarding address exists, and email is set up", async () => {
    for (const env of [
      { ...ENV, SAFEGUARDING_INTAKE_ENABLED: undefined },
      { ...ENV, SAFEGUARDING_EMAILS: "" },
      { ...ENV, RESEND_API_KEY: undefined },
    ]) {
      const calls: string[] = [];
      expect(await processSafeguarding(concern, sg({ env }, calls))).toMatchObject({
        ok: false,
        reason: "disabled",
      });
      expect(calls).toHaveLength(0);
    }
  });
  it("accepts an anonymous concern and reports whether the alert went out", async () => {
    const calls: string[] = [];
    expect(await processSafeguarding(concern, sg({}, calls))).toEqual({
      ok: true,
      reference: "MGA-SGD-2026-0001",
      alerted: true,
    });
    expect(calls[0]).toBe("check_and_record_throttle");
    expect(calls[1]).toContain("submit_safeguarding_concern");
    expect(calls[1]).not.toContain("website");
    expect(await processSafeguarding(concern, sg({ alert: async () => false }))).toMatchObject({
      ok: true,
      alerted: false,
    });
    expect(
      await processSafeguarding(
        concern,
        sg({
          alert: async () => {
            throw new Error("x");
          },
        }),
      ),
    ).toMatchObject({ ok: true, alerted: false });
  });
  it("needs a message, rejects a filled honeypot, and rate-limits", async () => {
    expect(await processSafeguarding({ ...concern, message: "" }, sg())).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(await processSafeguarding({ ...concern, website: "x" }, sg())).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(
      await processSafeguarding(concern, sg({ rpc: async () => ({ data: false, error: null }) })),
    ).toMatchObject({ ok: false, reason: "rate_limited" });
  });
  it("never reports success when the save failed", async () => {
    const result = await processSafeguarding(
      concern,
      sg({
        rpc: async (n) =>
          n === "check_and_record_throttle"
            ? { data: true, error: null }
            : { data: null, error: { code: "XX000" } },
      }),
    );
    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
  });
});

describe("idempotency keys", () => {
  const config: EmailConfig = {
    apiKey: "k",
    from: "A <a@x.org>",
    apiUrl: "https://api.resend.com/emails",
  };
  const message: EmailMessage = { to: ["t@x.org"], subject: "S", text: "T", html: "<p>T</p>" };
  const headerFor = async (idempotencyKey: string | undefined) => {
    let headers: Record<string, string> = {};
    await sendEmail(config, { ...message, idempotencyKey }, (async (
      _u: string,
      init: RequestInit,
    ) => {
      headers = init.headers as Record<string, string>;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch);
    return headers;
  };

  it("sends the key in the Idempotency-Key header, and omits it when absent or unusable", async () => {
    expect(
      (await headerFor("staff_notification/MGA-ENQ-2026-0001/abc123"))["idempotency-key"],
    ).toBe("staff_notification/MGA-ENQ-2026-0001/abc123");
    expect(await headerFor(undefined)).not.toHaveProperty("idempotency-key");
    expect(await headerFor("")).not.toHaveProperty("idempotency-key");
    expect(await headerFor("has space")).not.toHaveProperty("idempotency-key");
    expect(await headerFor("line\nbreak")).not.toHaveProperty("idempotency-key");
    expect(await headerFor("x".repeat(257))).not.toHaveProperty("idempotency-key");
    expect(await headerFor("x".repeat(256))).toHaveProperty("idempotency-key");
  });

  it("uses template/reference/fingerprint, the same on every retry of the same email", async () => {
    const keys: (string | undefined)[] = [];
    const { deps } = setup();
    deps.send = async (_c, m) => {
      keys.push(m.idempotencyKey);
      return { ok: false, code: "http_500" };
    };
    await sendTemplate(enquiry.reference, "staff_notification", deps);
    await sendTemplate(enquiry.reference, "staff_notification", deps); // claim re-opens a failed email
    expect(keys[0]).toMatch(/^staff_notification\/MGA-ENQ-2026-0001\/[0-9a-f]{16}$/);
    expect(keys[1]).toBe(keys[0]);
  });

  it("gives a different key when the email really is different (recipients changed), so the provider never sees a reused key with another payload", async () => {
    const keyWith = async (staff: string) => {
      let key: string | undefined;
      const { deps } = setup({ env: { ...ENV, STAFF_NOTIFY_EMAILS: staff } });
      deps.send = async (_c, m) => {
        key = m.idempotencyKey;
        return { ok: true, id: "i" };
      };
      await sendTemplate(enquiry.reference, "staff_notification", deps);
      return key;
    };
    const a = await keyWith("one@example.org");
    expect(await keyWith("one@example.org")).toBe(a);
    expect(await keyWith("one@example.org, two@example.org")).not.toBe(a);
  });

  it("keeps different emails for the same submission apart", async () => {
    const keys = new Set<string | undefined>();
    const { deps } = setup();
    deps.send = async (_c, m) => {
      keys.add(m.idempotencyKey);
      return { ok: true, id: "i" };
    };
    await notifySubmission(enquiry.reference, "enquiry", deps);
    expect(keys.size).toBe(2);
  });
});

describe("a lost reply cannot cause a duplicate email (real HTTP, provider remembers keys)", () => {
  let server: Server | undefined;
  afterEach(
    () => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())),
  );

  /** Behaves like the provider: accepts the email, remembers the key, and (once) drops the connection before replying. */
  async function provider(dropFirstReply: boolean) {
    const delivered: string[] = [];
    const remembered = new Map<string, string>();
    let first = true;
    server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const key = String(req.headers["idempotency-key"] ?? "");
        let id = remembered.get(key);
        if (!id) {
          id = `email-${delivered.length + 1}`;
          delivered.push(JSON.parse(body).subject);
          if (key) remembered.set(key, id);
        }
        if (dropFirstReply && first) {
          first = false;
          req.socket.destroy();
          return;
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ id }));
      });
    });
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
    const port = (server.address() as { port: number }).port;
    return { delivered, url: `http://127.0.0.1:${port}/emails` };
  }

  it("with the key: the retry after a dropped reply delivers exactly one email", async () => {
    const { delivered, url } = await provider(true);
    const db = fakeDb({ [enquiry.reference]: enquiry });
    const deps: NotifyDeps = {
      rpc: db.rpc,
      env: { ...ENV, RESEND_API_URL: url },
      log: () => undefined,
    };
    expect(await sendTemplate(enquiry.reference, "staff_notification", deps)).toBe("failed"); // the reply was lost
    expect(delivered).toHaveLength(1); // ...but the provider did send it
    const summary = await retryFailedEmails(deps);
    expect(summary).toMatchObject({ attempted: 1, sent: 1 });
    expect(delivered).toHaveLength(1); // the retry did NOT send a second copy
    expect([...db.log.values()][0]?.status).toBe("sent");
  });

  it("without the key the same situation would send twice (why the key matters)", async () => {
    const { delivered, url } = await provider(true);
    const config = readEmailConfig({ ...ENV, RESEND_API_URL: url })!;
    const message: EmailMessage = {
      to: ["t@x.org"],
      subject: "Same email",
      text: "T",
      html: "<p>T</p>",
    };
    expect(await sendEmail(config, message)).toEqual({ ok: false, code: "network" });
    expect(await sendEmail(config, message)).toMatchObject({ ok: true });
    expect(delivered).toHaveLength(2);
  });
});
