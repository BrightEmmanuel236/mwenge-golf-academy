import { sha256Hex, type SubmitDeps } from "./submit.server";
import {
  isEmailAddress,
  parseAddressList,
  readEmailConfig,
  sendEmail,
  type EmailConfig,
  type EmailMessage,
  type SendResult,
} from "./email.server";
import {
  buildEmail,
  type EmailTemplate,
  type SubmissionData,
  type SubmissionKind,
} from "./email-templates";

/**
 * Emails for saved submissions (PRD AC-E1, AC-Q2, AC-Q3, §11.4). Server only.
 *
 * The record is always saved first. Each email is then claimed in the database (so it is never sent
 * twice), built from the saved record (so a retry works after a crash), sent, and its outcome logged.
 * Nothing here can undo or hide a saved submission: failures are recorded and retried.
 */

export interface NotifyDeps {
  rpc: SubmitDeps["rpc"];
  env: Record<string, string | undefined>;
  /** Defaults to the real provider call; tests pass a fake. */
  send?: ((config: EmailConfig, message: EmailMessage) => Promise<SendResult>) | undefined;
  /** Receives non-identifying diagnostics only (reference, template, error code). */
  log?: ((message: string) => void) | undefined;
}

export type SendOutcome = "sent" | "failed" | "skipped";

const templates: readonly EmailTemplate[] = [
  "staff_notification",
  "sender_confirmation",
  "safeguarding_alert",
];
const recipientKind: Record<EmailTemplate, string> = {
  staff_notification: "staff",
  sender_confirmation: "sender",
  safeguarding_alert: "safeguarding",
};

export async function sendTemplate(
  reference: string,
  template: EmailTemplate,
  deps: NotifyDeps,
): Promise<SendOutcome> {
  const log = deps.log ?? (() => undefined);
  const finish = (ok: boolean, code: string | null, providerId: string | null = null) =>
    deps.rpc("finish_email", {
      _reference: reference,
      _template: template,
      _ok: ok,
      _provider_id: providerId,
      _error_code: code,
    });

  try {
    const claim = await deps.rpc("claim_email", {
      _reference: reference,
      _template: template,
      _recipient_kind: recipientKind[template],
    });
    if (claim.error) {
      log(`email: could not claim ${template} for ${reference} (${claim.error.code ?? "no code"})`);
      return "failed";
    }
    if (claim.data !== true) return "skipped"; // already sent, or being sent

    const loaded = await deps.rpc("get_submission_for_email", { _reference: reference });
    const data = loaded.data as SubmissionData | null;
    if (loaded.error || !data) {
      await finish(false, "load_failed");
      return "failed";
    }

    // A safeguarding report never produces a general email, and the reverse.
    if ((data.kind === "safeguarding") !== (template === "safeguarding_alert")) {
      await finish(false, "wrong_template");
      return "failed";
    }

    const replyToSender = isEmailAddress(data.email) ? data.email : undefined;
    let to: string[];
    let replyTo: string | undefined;
    if (template === "staff_notification") {
      to = parseAddressList(deps.env["STAFF_NOTIFY_EMAILS"]);
      replyTo = replyToSender;
    } else if (template === "safeguarding_alert") {
      to = parseAddressList(deps.env["SAFEGUARDING_EMAILS"]);
      replyTo = replyToSender;
    } else {
      to = replyToSender ? [replyToSender] : [];
      replyTo = parseAddressList(deps.env["ACADEMY_REPLY_TO"])[0];
    }
    if (to.length === 0) {
      await finish(false, "no_recipients");
      return "failed";
    }
    const config = readEmailConfig(deps.env);
    if (!config) {
      await finish(false, "not_configured");
      return "failed";
    }

    const built = buildEmail(template, data);
    // Same email => same key, so a retry after a lost reply cannot send twice. The key includes a
    // fingerprint of who it goes to and what it says: if settings change so the email really is
    // different, it gets a new key (the provider rejects a reused key with a different payload).
    const fingerprint = (
      await sha256Hex(JSON.stringify({ from: config.from, to, replyTo, subject: built.subject }))
    ).slice(0, 16);
    const result = await (deps.send ?? sendEmail)(config, {
      to,
      replyTo,
      idempotencyKey: `${template}/${reference}/${fingerprint}`,
      ...built,
    });
    if (result.ok) {
      await finish(true, null, result.id);
      return "sent";
    }
    await finish(false, result.code);
    log(`email: ${template} for ${reference} not sent (${result.code})`);
    return "failed";
  } catch {
    try {
      await finish(false, "exception");
    } catch {
      /* the retry sweep still finds it */
    }
    log(`email: unexpected error for ${template} on ${reference}`);
    return "failed";
  }
}

/** Staff notification and sender confirmation for an ordinary submission, or only the alert for a safeguarding concern. */
export async function notifySubmission(
  reference: string,
  kind: SubmissionKind,
  deps: NotifyDeps,
): Promise<Partial<Record<EmailTemplate, SendOutcome>>> {
  if (kind === "safeguarding") {
    return { safeguarding_alert: await sendTemplate(reference, "safeguarding_alert", deps) };
  }
  const [staff, sender] = await Promise.all([
    sendTemplate(reference, "staff_notification", deps),
    sendTemplate(reference, "sender_confirmation", deps),
  ]);
  return { staff_notification: staff, sender_confirmation: sender };
}

export interface RetrySummary {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
}

/** Sends emails that failed, got stuck, or were never started (the server stopped right after saving). */
export async function retryFailedEmails(deps: NotifyDeps, limit = 20): Promise<RetrySummary> {
  const summary: RetrySummary = { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  const listed = await deps.rpc("list_emails_to_retry", { _limit: limit });
  if (listed.error || !Array.isArray(listed.data)) {
    deps.log?.(`email: retry list failed (${listed.error?.code ?? "unexpected reply"})`);
    return summary;
  }
  for (const entry of listed.data as { reference?: unknown; template?: unknown }[]) {
    const template = templates.find((candidate) => candidate === entry.template);
    if (typeof entry.reference !== "string" || !template) continue;
    summary.attempted += 1;
    const outcome = await sendTemplate(entry.reference, template, deps);
    summary[outcome] += 1;
  }
  return summary;
}
