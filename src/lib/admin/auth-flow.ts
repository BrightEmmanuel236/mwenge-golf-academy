/**
 * Staff sign-in rules (PRD 10.1): a password is never enough. Staff finish a second step (an authenticator
 * app code) before any record is readable. The database enforces this too (see the B3 migration), so these
 * rules only decide which screen to show.
 */

export type AuthStep = "signin" | "enroll" | "verify" | "ready";

export interface Assurance {
  /** "aal1" = password only, "aal2" = second step done (the SDK may add other values). */
  currentLevel: string | null;
  nextLevel: string | null;
}

/**
 * - not signed in                      -> signin
 * - signed in, second step done        -> ready
 * - signed in, has an authenticator    -> verify (enter the code)
 * - signed in, no authenticator yet    -> enroll (set one up, then enter a code)
 */
export function nextAuthStep(signedIn: boolean, assurance: Assurance | null): AuthStep {
  if (!signedIn || !assurance) return "signin";
  if (assurance.currentLevel === "aal2") return "ready";
  return assurance.nextLevel === "aal2" ? "verify" : "enroll";
}

export const authMessages = {
  // One message for an unknown email and a wrong password, so it cannot be used to find staff addresses.
  signIn: "Email or password is incorrect.",
  code: "That code is not correct or has expired. Use the newest code from your authenticator app.",
  tooMany: "Too many attempts. Wait a minute, then try again.",
  generic: "Something went wrong. Please try again.",
} as const;

interface AuthErrorLike {
  status?: number | undefined;
  code?: string | undefined;
}

/** Turns a Supabase auth error into a plain message that reveals nothing about which part was wrong. */
export function friendlyAuthError(
  error: AuthErrorLike | null | undefined,
  step: "signin" | "code",
): string {
  if (!error) return authMessages.generic;
  if (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit"
  ) {
    return authMessages.tooMany;
  }
  if (step === "code") {
    return error.status && error.status >= 500 ? authMessages.generic : authMessages.code;
  }
  return error.status && error.status >= 500 ? authMessages.generic : authMessages.signIn;
}
