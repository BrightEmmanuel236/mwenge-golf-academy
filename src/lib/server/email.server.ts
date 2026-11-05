/**
 * Sending email (PRD §5, §9.1). Server only. Uses the provider's web API through `fetch`, so it needs no
 * extra package and works on both Cloudflare and Vercel. Addresses come from host settings, never from code.
 */

export interface EmailMessage {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | undefined;
  /**
   * Sent as the provider's `Idempotency-Key` header: the same key means "the same email", so retrying a
   * request whose reply was lost cannot send it twice (the provider remembers keys for 24 hours).
   */
  idempotencyKey?: string | undefined;
}

export type SendResult = { ok: true; id: string | null } | { ok: false; code: string };

export interface EmailConfig {
  apiKey: string;
  /** e.g. `Mwenge Golf Academy <notifications@example.org>` */
  from: string;
  apiUrl: string;
}

const DEFAULT_API_URL = "https://api.resend.com/emails";
const ADDRESS = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;

export const isEmailAddress = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 254 && ADDRESS.test(value);

/** "a@x.org, b@y.org" -> ["a@x.org", "b@y.org"]. Invalid entries are dropped; at most 10 are kept. */
export function parseAddressList(value: string | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const part of value.split(/[\s,;]+/)) {
    const address = part.trim().toLowerCase();
    if (isEmailAddress(address)) seen.add(address);
  }
  return [...seen].slice(0, 10);
}

/** Null when sending is not set up (no key or no sender): callers record that, they do not guess. */
export function readEmailConfig(env: Record<string, string | undefined>): EmailConfig | null {
  const apiKey = env["RESEND_API_KEY"]?.trim();
  const from = env["EMAIL_FROM"]?.trim();
  if (!apiKey || !from) return null;
  // The address can be overridden only to talk to a local test server, never to another host.
  const override = env["RESEND_API_URL"]?.trim();
  const local = override && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(override);
  return { apiKey, from, apiUrl: local ? override : DEFAULT_API_URL };
}

export async function sendEmail(
  config: EmailConfig,
  message: EmailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(config.apiUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
        ...(message.idempotencyKey && /^[\x21-\x7e]{1,256}$/.test(message.idempotencyKey)
          ? { "idempotency-key": message.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, code: `http_${response.status}` };
    const body = (await response.json().catch(() => null)) as { id?: unknown } | null;
    return { ok: true, id: typeof body?.id === "string" ? body.id : null };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error && error.name === "AbortError" ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}
