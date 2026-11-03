import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** B1 amendment 6: no privileged Supabase key may live in .env or any VITE_* variable. */
const envFiles = [".env", ".env.local", ".env.production", ".env.development"]
  .map((f) => resolve(process.cwd(), f))
  .filter(existsSync);

const isSecret = (value: string) => {
  if (/sb_secret_/.test(value)) return true;
  // Legacy JWT keys: decode the payload and look for the service_role claim.
  const parts = value.replace(/^["']|["']$/g, "").split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8"));
      if (payload?.role === "service_role") return true;
    } catch {
      /* not a JWT */
    }
  }
  return /service_role/i.test(value);
};

describe("environment files hold no secret keys", () => {
  it.each(envFiles.length ? envFiles : ["(no .env files)"])("%s", (file) => {
    if (!existsSync(file)) return;
    const offenders = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .filter((line) => isSecret(line.slice(line.indexOf("=") + 1)) || /SERVICE_ROLE/i.test(line))
      .map((line) => line.split("=")[0]);
    expect(offenders).toEqual([]);
  });

  it("detects a secret key if one is added", () => {
    expect(isSecret("sb_secret_abc123")).toBe(true);
    const jwt = `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.y`;
    expect(isSecret(jwt)).toBe(true);
    expect(isSecret("sb_publishable_abc")).toBe(false);
  });
});
