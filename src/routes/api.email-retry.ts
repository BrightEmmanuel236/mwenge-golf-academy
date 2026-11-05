import { createFileRoute } from "@tanstack/react-router";

/**
 * Retries emails that failed or never started. Called by a scheduler, not by visitors.
 * Off unless CRON_SECRET is set; needs `Authorization: Bearer <CRON_SECRET>`. See docs/B2-SETUP.md.
 * Server modules are loaded inside the handlers so none of this reaches the browser bundle.
 */
const run = async ({ request }: { request: Request }) => {
  const { loadRuntime } = await import("@/lib/server/runtime.server");
  const { handleEmailRetry } = await import("@/lib/server/email-retry.server");
  return handleEmailRetry(request, loadRuntime());
};

export const Route = createFileRoute("/api/email-retry")({
  server: { handlers: { GET: run, POST: run } },
});
