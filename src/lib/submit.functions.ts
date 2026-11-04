import { createServerFn } from "@tanstack/react-start";
import type { SubmitResult } from "@/lib/submissions";

/**
 * Saves a public form submission. The only route from the browser to the submission tables
 * (PRD 9.3): it validates again, checks the honeypot and rate limit, and writes through the
 * database's own functions using the server-only service key. Never import server modules at the
 * top of this file: it ships to the browser, so they are loaded inside the handler.
 */
export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { clientIpFrom, processSubmission } = await import("./server/submit.server");
    const headers = getRequest().headers;
    return processSubmission(data, {
      // The generated database types do not list our functions until they are regenerated.
      rpc: (name, args) => (supabaseAdmin.rpc as unknown as SupabaseRpc)(name, args),
      env: process.env,
      ip: clientIpFrom((name) => headers.get(name)),
      log: (message) => console.error(message),
    });
  });

type SupabaseRpc = (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
