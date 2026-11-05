import { contactSchema, enquirySchema, pledgeSchema, sponsorSchema } from "@/lib/schemas";
import {
  failureMessages,
  submissionKinds,
  type SubmissionKind,
  type SubmitFailure,
  type SubmitResult,
} from "@/lib/submissions";

/**
 * Server-side half of saving a public form (PRD SEC-3, SEC-5, SEC-6; amendments in the B1 plan).
 * Runs on the server only. The database client is passed in so this logic can be tested without a
 * database; the real wiring is in `src/lib/submit.functions.ts`.
 *
 * Order matters: switched on? -> valid input (and honeypot empty)? -> under the rate limit? ->
 * saved. A visitor is only ever told "saved" after the database confirms it.
 */

export interface SubmitDeps {
  /** Calls a database function. Returns the Supabase-style `{ data, error }` shape. */
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { code?: string | undefined } | null }>;
  env: Record<string, string | undefined>;
  /** Visitor's IP address as reported by the host, or null when it cannot be determined. */
  ip: string | null;
  /** Receives non-identifying diagnostics only (kind, error code). */
  log?: (message: string) => void;
  /** Sends the emails for a saved submission. It can never change the result: failures are logged and retried. */
  notify?: ((kind: SubmissionKind, reference: string) => Promise<unknown>) | undefined;
}

const schemas = {
  enquiry: enquirySchema,
  contact: contactSchema,
  sponsor: sponsorSchema,
  pledge: pledgeSchema,
} as const;

const rpcNames: Record<SubmissionKind, string> = {
  enquiry: "submit_enquiry",
  contact: "submit_contact_message",
  sponsor: "submit_sponsor_enquiry",
  pledge: "submit_equipment_pledge",
};

const fail = (
  reason: SubmitFailure["reason"],
  extra?: { fieldErrors?: Record<string, string> },
): SubmitFailure => ({ ok: false, reason, message: failureMessages[reason], ...extra });

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Best available client IP. Cloudflare and Vercel both set these headers themselves; on a host
 * that does not overwrite them they could be forged, so the per-IP limit is best-effort while the
 * per-email limit and the database rules do not depend on it.
 */
export function clientIpFrom(get: (name: string) => string | null | undefined): string | null {
  const direct = get("cf-connecting-ip")?.trim() || get("x-real-ip")?.trim();
  if (direct) return direct;
  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

export async function processSubmission(input: unknown, deps: SubmitDeps): Promise<SubmitResult> {
  const log = deps.log ?? (() => undefined);

  if (deps.env["FORMS_SAVING_ENABLED"] !== "true") return fail("disabled");

  const body = (typeof input === "object" && input !== null ? input : {}) as {
    kind?: unknown;
    data?: unknown;
  };
  const kind = submissionKinds.find((candidate) => candidate === body.kind);
  if (!kind) return fail("invalid");

  // SEC-3: validate again on the server. The honeypot field must be empty (schema enforces it).
  const parsed = schemas[kind].safeParse(body.data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail("invalid", { fieldErrors });
  }
  const { website: _honeypot, ...payload } = parsed.data as Record<string, unknown>;
  const email = String(payload["email"]);

  // SEC-6: per-email and per-IP limits. Only salted hashes leave this function. Without a salt
  // the hashes would be guessable, so refuse to run rather than store weak ones.
  const pepper = deps.env["THROTTLE_PEPPER"];
  if (!pepper) {
    log("submit: THROTTLE_PEPPER is not set; refusing to save");
    return fail("unavailable");
  }
  const emailHash = await sha256Hex(`${pepper}:email:${email}`);
  // If the host gives no IP, use a one-off key so the IP limit cannot lock everyone out together.
  const ipHash = await sha256Hex(`${pepper}:ip:${deps.ip ?? crypto.randomUUID()}`);
  const throttle = await deps.rpc("check_and_record_throttle", {
    _email_hash: emailHash,
    _ip_hash: ipHash,
  });
  if (throttle.error) {
    log(`submit: throttle check failed (${throttle.error.code ?? "no code"})`);
    return fail("unavailable");
  }
  if (throttle.data !== true) return fail("rate_limited");

  const saved = await deps.rpc(rpcNames[kind], { p: payload });
  if (saved.error || typeof saved.data !== "string") {
    // Log the code only: error text from the database can quote the submitted values.
    log(`submit: ${kind} not saved (${saved.error?.code ?? "no reference returned"})`);
    return fail("unavailable");
  }
  if (deps.notify) {
    try {
      await deps.notify(kind, saved.data);
    } catch {
      log(`submit: ${kind} saved, but sending its emails failed; the retry sweep will pick it up`);
    }
  }
  return { ok: true, reference: saved.data };
}
