import { createServerFn } from "@tanstack/react-start";
import type { SubmitResult } from "@/lib/submissions";

/**
 * Saves a public form submission, then sends its emails. The only route from the browser to the
 * submission tables (PRD 9.3): it validates again, checks the honeypot and rate limit, and writes
 * through the database's own functions using the server-only service key. Never import server
 * modules at the top of this file: it ships to the browser, so they are loaded inside the handler.
 */
export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { loadRuntime } = await import("./server/runtime.server");
    const { processSubmission } = await import("./server/submit.server");
    const { notifySubmission } = await import("./server/notify.server");
    const runtime = loadRuntime();
    return processSubmission(data, {
      ...runtime,
      notify: (kind, reference) => notifySubmission(reference, kind, runtime),
    });
  });
