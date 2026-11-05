import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { clientIpFrom, type SubmitDeps } from "./submit.server";

/** The real database, settings, client address and logger, for the server functions and routes. */
export function loadRuntime(): Pick<SubmitDeps, "rpc" | "env" | "ip" | "log"> {
  // The generated database types do not list our functions until they are regenerated.
  const admin = supabaseAdmin as unknown as { rpc: SubmitDeps["rpc"] };
  const headers = getRequest().headers;
  return {
    rpc: (name, args) => admin.rpc(name, args),
    env: process.env,
    ip: clientIpFrom((name) => headers.get(name)),
    log: (message) => console.error(message),
  };
}
