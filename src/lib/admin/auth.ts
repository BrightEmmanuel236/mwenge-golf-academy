import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, nextAuthStep, type Assurance, type AuthStep } from "./auth-flow";

/** Browser side of staff sign-in. There is deliberately no sign-up: staff accounts are created by the owner. */

export type StaffRole = "super_admin" | "academy_admin" | "content_manager" | "safeguarding_lead";

export type Outcome = { ok: true } | { ok: false; message: string };

export interface StaffSnapshot {
  step: AuthStep;
  email: string | null;
  roles: StaffRole[];
}

export async function signIn(email: string, password: string): Promise<Outcome> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return error ? { ok: false, message: friendlyAuthError(error, "signin") } : { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Where the current session stands, and which roles it holds once the second step is done. */
export async function readSnapshot(): Promise<StaffSnapshot> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return { step: "signin", email: null, roles: [] };

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const assurance: Assurance | null =
    error || !data ? null : { currentLevel: data.currentLevel, nextLevel: data.nextLevel };
  const step = nextAuthStep(true, assurance);
  const email = session.user.email ?? null;
  if (step !== "ready") return { step, email, roles: [] };

  const { data: rows } = await supabase.from("user_roles").select("role");
  return { step, email, roles: (rows ?? []).map((row) => row.role) };
}

/** The id of the person's verified authenticator, if they have set one up. */
export async function verifiedFactorId(): Promise<string | null> {
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp[0]?.id ?? null;
}

export type Enrollment =
  { ok: true; factorId: string; qrCode: string; secret: string } | { ok: false; message: string };

/** Starts setting up an authenticator app. Half-finished earlier attempts are removed first. */
export async function beginEnrollment(): Promise<Enrollment> {
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const factor of existing?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Mwenge staff authenticator",
  });
  if (error || !data) return { ok: false, message: friendlyAuthError(error, "code") };
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyCode(factorId: string, code: string): Promise<Outcome> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: code.replace(/\s+/g, ""),
  });
  return error ? { ok: false, message: friendlyAuthError(error, "code") } : { ok: true };
}
