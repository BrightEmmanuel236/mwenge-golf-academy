import { safeguardingSchema } from "@/lib/schemas";
import { failureMessages, type SafeguardingResult } from "@/lib/submissions";
import { parseAddressList, readEmailConfig } from "./email.server";
import { sha256Hex, type SubmitDeps } from "./submit.server";

/**
 * Saves a safeguarding concern (PRD W10, AC-Q3). Server only. It is separate from the general forms on
 * purpose: no contact record is created, nothing goes to the general staff list, and the alert goes
 * only to SAFEGUARDING_EMAILS. It stays switched off until the client names the Safeguarding Lead:
 * it needs SAFEGUARDING_INTAKE_ENABLED=true, at least one valid safeguarding address, and email set up.
 * There is deliberately no screen for it yet.
 */
export interface SafeguardingDeps extends Omit<SubmitDeps, "notify"> {
  /** Sends the alert for a saved concern; returns whether it went out. */
  alert: (reference: string) => Promise<boolean>;
}

export async function processSafeguarding(
  input: unknown,
  deps: SafeguardingDeps,
): Promise<SafeguardingResult> {
  const log = deps.log ?? (() => undefined);
  const ready =
    deps.env["SAFEGUARDING_INTAKE_ENABLED"] === "true" &&
    parseAddressList(deps.env["SAFEGUARDING_EMAILS"]).length > 0 &&
    readEmailConfig(deps.env) !== null;
  if (!ready) {
    return { ok: false, reason: "disabled", message: failureMessages.disabled };
  }

  const parsed = safeguardingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, reason: "invalid", message: failureMessages.invalid, fieldErrors };
  }
  const { website: _honeypot, ...payload } = parsed.data;

  const pepper = deps.env["THROTTLE_PEPPER"];
  if (!pepper) {
    log("safeguarding: THROTTLE_PEPPER is not set; refusing to save");
    return { ok: false, reason: "unavailable", message: failureMessages.unavailable };
  }
  // Anonymous reporters have no email, so only the address limit applies to them.
  const emailHash = await sha256Hex(`${pepper}:email:${payload.email || crypto.randomUUID()}`);
  const ipHash = await sha256Hex(`${pepper}:ip:${deps.ip ?? crypto.randomUUID()}`);
  const throttle = await deps.rpc("check_and_record_throttle", {
    _email_hash: emailHash,
    _ip_hash: ipHash,
  });
  if (throttle.error) {
    log(`safeguarding: throttle check failed (${throttle.error.code ?? "no code"})`);
    return { ok: false, reason: "unavailable", message: failureMessages.unavailable };
  }
  if (throttle.data !== true) {
    return { ok: false, reason: "rate_limited", message: failureMessages.rate_limited };
  }

  const saved = await deps.rpc("submit_safeguarding_concern", { p: payload });
  if (saved.error || typeof saved.data !== "string") {
    log(`safeguarding: not saved (${saved.error?.code ?? "no reference returned"})`);
    return { ok: false, reason: "unavailable", message: failureMessages.unavailable };
  }
  let alerted = false;
  try {
    alerted = await deps.alert(saved.data);
  } catch {
    log("safeguarding: alert step failed; the retry sweep will pick it up");
  }
  return { ok: true, reference: saved.data, alerted };
}
