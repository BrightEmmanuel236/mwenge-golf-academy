import { createServerFn } from "@tanstack/react-start";
import type { SafeguardingResult } from "@/lib/submissions";

/**
 * Saves a safeguarding concern and alerts only the safeguarding contacts (PRD W10, AC-Q3).
 * Switched off unless SAFEGUARDING_INTAKE_ENABLED=true and the safeguarding addresses and email are
 * set up. No screen calls this yet: that needs the client's approved wording and a named lead.
 */
export const submitSafeguardingConcern = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<SafeguardingResult> => {
    const { loadRuntime } = await import("./server/runtime.server");
    const { processSafeguarding } = await import("./server/safeguarding.server");
    const { notifySubmission } = await import("./server/notify.server");
    const runtime = loadRuntime();
    return processSafeguarding(data, {
      ...runtime,
      alert: async (reference) => {
        const outcome = await notifySubmission(reference, "safeguarding", runtime);
        return outcome.safeguarding_alert === "sent";
      },
    });
  });
