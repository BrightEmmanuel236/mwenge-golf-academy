import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { authMessages, friendlyAuthError, nextAuthStep } from "@/lib/admin/auth-flow";

describe("which sign-in screen to show", () => {
  it("asks for a password when nobody is signed in", () => {
    expect(nextAuthStep(false, null)).toBe("signin");
    expect(nextAuthStep(false, { currentLevel: "aal2", nextLevel: "aal2" })).toBe("signin");
    expect(nextAuthStep(true, null)).toBe("signin");
  });
  it("asks for the code once a password is accepted and an authenticator exists", () => {
    expect(nextAuthStep(true, { currentLevel: "aal1", nextLevel: "aal2" })).toBe("verify");
  });
  it("sets up an authenticator when the person has none yet", () => {
    expect(nextAuthStep(true, { currentLevel: "aal1", nextLevel: "aal1" })).toBe("enroll");
  });
  it("lets the person in only after the second step", () => {
    expect(nextAuthStep(true, { currentLevel: "aal2", nextLevel: "aal2" })).toBe("ready");
  });
  it("never lets a password alone through, whatever the other level says", () => {
    for (const next of ["aal1", "aal2", null, "something-new"]) {
      expect(nextAuthStep(true, { currentLevel: "aal1", nextLevel: next })).not.toBe("ready");
    }
    expect(nextAuthStep(true, { currentLevel: null, nextLevel: "aal2" })).not.toBe("ready");
  });
});

describe("sign-in error messages", () => {
  it("uses one message for an unknown email and a wrong password", () => {
    expect(friendlyAuthError({ status: 400, code: "invalid_credentials" }, "signin")).toBe(
      authMessages.signIn,
    );
    expect(friendlyAuthError({ status: 400, code: "user_not_found" }, "signin")).toBe(
      authMessages.signIn,
    );
    expect(friendlyAuthError({ status: 400 }, "signin")).toBe(authMessages.signIn);
  });
  it("explains a wrong or expired code without detail", () => {
    expect(friendlyAuthError({ status: 422, code: "mfa_verification_failed" }, "code")).toBe(
      authMessages.code,
    );
  });
  it("says to wait when rate limited, and 'try again' for server trouble", () => {
    expect(friendlyAuthError({ status: 429 }, "signin")).toBe(authMessages.tooMany);
    expect(friendlyAuthError({ code: "over_request_rate_limit" }, "code")).toBe(
      authMessages.tooMany,
    );
    expect(friendlyAuthError({ status: 503 }, "signin")).toBe(authMessages.generic);
    expect(friendlyAuthError(null, "signin")).toBe(authMessages.generic);
  });
  it("never echoes anything from the error into the message", () => {
    const message = friendlyAuthError(
      { status: 400, code: "user@example.com does not exist" },
      "signin",
    );
    expect(message).not.toContain("example.com");
  });
});

/** Source guards: staff code must not be able to create accounts or hold the server's secret key. */
describe("staff area source rules", () => {
  const root = join(__dirname, "../../..");
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  const files = [
    ...walk(join(root, "src/lib/admin")),
    ...walk(join(root, "src/components/admin")),
    ...readdirSync(join(root, "src/routes"))
      .filter((name) => name.startsWith("admin"))
      .map((name) => join(root, "src/routes", name)),
  ];
  const contents = files.map((file) => ({ file, text: readFileSync(file, "utf8") }));

  it("found the staff files to check", () => {
    expect(files.length).toBeGreaterThan(8);
  });
  it.each([
    ["sign-up", /\.signUp\(|signInWithOtp|signInWithOAuth|signInWithSSO|signInAnonymously/],
    ["password reset by email", /resetPasswordForEmail/],
    ["the server's secret key", /SERVICE_ROLE|service_role|supabaseAdmin|client\.server/],
    ["raw HTML injection", /dangerouslySetInnerHTML/],
    ["browser storage of tokens", /localStorage|sessionStorage/],
  ])("has no %s", (_name, pattern) => {
    for (const { file, text } of contents) {
      expect(pattern.test(text), file).toBe(false);
    }
  });
});
