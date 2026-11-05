import { retryFailedEmails, type NotifyDeps } from "./notify.server";
import { sha256Hex } from "./submit.server";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Compares two secrets without stopping at the first difference. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let difference = 0;
  for (let i = 0; i < x.length; i += 1) difference |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return difference === 0;
}

/**
 * The address a scheduler (Vercel Cron, GitHub Actions, any cron service) calls to retry emails.
 * Off unless CRON_SECRET is set to a long random value; needs `Authorization: Bearer <that value>`.
 * Vercel Cron sends exactly that header when the CRON_SECRET setting exists.
 */
export async function handleEmailRetry(request: Request, deps: NotifyDeps): Promise<Response> {
  const secret = deps.env["CRON_SECRET"];
  if (!secret || secret.length < 16) return json({ error: "not_found" }, 404);
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!(await safeEqual(provided, secret))) return json({ error: "unauthorized" }, 401);
  return json(await retryFailedEmails(deps), 200);
}
