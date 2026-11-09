import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  beginEnrollment,
  signIn,
  signOut,
  verifiedFactorId,
  verifyCode,
  type Enrollment,
} from "@/lib/admin/auth";
import { useStaff } from "@/lib/admin/staff-context";

/**
 * Staff sign-in: password, then a code from an authenticator app (set up on the first sign-in).
 * There is no "create account": staff accounts are created by the owner.
 */
export function LoginFlow({ onSignedIn }: { onSignedIn: () => void }) {
  const staff = useStaff();

  React.useEffect(() => {
    if (!staff.loading && staff.step === "ready") onSignedIn();
  }, [staff.loading, staff.step, onSignedIn]);

  if (staff.loading) {
    return (
      <p role="status" className="text-slate">
        Checking your sign-in…
      </p>
    );
  }
  if (staff.step === "verify") return <VerifyStep onDone={staff.refresh} />;
  if (staff.step === "enroll") return <EnrollStep onDone={staff.refresh} />;
  if (staff.step === "ready") {
    return (
      <p role="status" className="text-slate">
        Signed in. Taking you to the staff area…
      </p>
    );
  }
  return <PasswordStep onDone={staff.refresh} />;
}

function PasswordStep({ onDone }: { onDone: () => Promise<void> }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate aria-label="Staff sign-in">
      {error ? (
        <Alert tone="danger" title="Could not sign in">
          {error}
        </Alert>
      ) : null}
      <Field id="staff-email" label="Email address" required>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      <Field id="staff-password" label="Password" required>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
        {busy ? "Signing in…" : "Continue"}
      </Button>
    </form>
  );
}

function CodeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field
      id="staff-code"
      label="6-digit code"
      required
      hint="From your authenticator app. It changes every 30 seconds."
    >
      {(control) => (
        <Input
          {...control}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={9}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

function useCodeSubmit(factorId: string | null, onDone: () => Promise<void>) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !factorId) return;
    if (code.replace(/\s+/g, "").length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await verifyCode(factorId, code);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      setCode("");
      return;
    }
    await onDone();
  }
  return { code, setCode, error, busy, submit };
}

function SwitchAccount() {
  const staff = useStaff();
  return (
    <button
      type="button"
      className="text-canopy text-left text-sm underline underline-offset-4"
      onClick={async () => {
        await signOut();
        await staff.refresh();
      }}
    >
      Use a different account
    </button>
  );
}

function VerifyStep({ onDone }: { onDone: () => Promise<void> }) {
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const { code, setCode, error, busy, submit } = useCodeSubmit(factorId, onDone);
  React.useEffect(() => {
    void verifiedFactorId().then((id) => (id ? setFactorId(id) : setFailed(true)));
  }, []);

  if (failed) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="danger" title="Authenticator not found">
          Your account needs its authenticator set up again. Ask the super administrator.
        </Alert>
        <SwitchAccount />
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate aria-label="Second step">
      <p className="text-slate">
        Open your authenticator app and enter the current code for this site.
      </p>
      {error ? (
        <Alert tone="danger" title="Code not accepted">
          {error}
        </Alert>
      ) : null}
      <CodeField value={code} onChange={setCode} />
      <Button type="submit" size="lg" disabled={busy || !factorId} aria-busy={busy}>
        {busy ? "Checking…" : "Sign in"}
      </Button>
      <SwitchAccount />
    </form>
  );
}

function EnrollStep({ onDone }: { onDone: () => Promise<void> }) {
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null);
  const factorId = enrollment?.ok ? enrollment.factorId : null;
  const { code, setCode, error, busy, submit } = useCodeSubmit(factorId, onDone);
  React.useEffect(() => {
    let cancelled = false;
    void beginEnrollment().then((result) => {
      if (!cancelled) setEnrollment(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!enrollment) {
    return (
      <p role="status" className="text-slate">
        Preparing your authenticator setup…
      </p>
    );
  }
  if (!enrollment.ok) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="danger" title="Setup could not start">
          {enrollment.message}
        </Alert>
        <SwitchAccount />
      </div>
    );
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5"
      noValidate
      aria-label="Set up your authenticator"
    >
      <p className="text-slate">
        Staff must use a second step. Install an authenticator app (such as Google Authenticator,
        Microsoft Authenticator or Authy), scan this code, then enter the 6-digit code it shows.
      </p>
      <img
        src={enrollment.qrCode}
        alt="QR code to scan with your authenticator app"
        className="border-line size-48 rounded-md border bg-white p-2"
      />
      <p className="text-sm">
        Cannot scan? Enter this key in the app instead:{" "}
        <code className="bg-sand rounded px-1 break-all">{enrollment.secret}</code>
      </p>
      {error ? (
        <Alert tone="danger" title="Code not accepted">
          {error}
        </Alert>
      ) : null}
      <CodeField value={code} onChange={setCode} />
      <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
        {busy ? "Checking…" : "Finish setup"}
      </Button>
      <SwitchAccount />
    </form>
  );
}
