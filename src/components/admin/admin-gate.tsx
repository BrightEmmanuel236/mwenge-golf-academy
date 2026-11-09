import * as React from "react";
import { AdminShell } from "./admin-shell";
import type { StaffState } from "@/lib/admin/staff-context";

/**
 * Only a fully signed-in person (password and second step) sees anything but the sign-in page. This is
 * convenience for the screens: the database refuses the data to anyone else regardless.
 */
export function AdminGate({
  onLoginPage,
  staff,
  onNeedLogin,
  children,
}: {
  /**
   * True only when the sign-in screen itself is what is showing. This must come from the matched route, not
   * the address: during a redirect the address changes a moment before the screen does, and a staff screen
   * must never render in that gap.
   */
  onLoginPage: boolean;
  staff: StaffState;
  onNeedLogin: () => void;
  children: React.ReactNode;
}) {
  const mustSignIn = !staff.loading && staff.step !== "ready" && !onLoginPage;

  React.useEffect(() => {
    if (mustSignIn) onNeedLogin();
  }, [mustSignIn, onNeedLogin]);

  if (onLoginPage) return <>{children}</>;
  if (staff.loading) {
    return (
      <p role="status" className="text-slate p-8">
        Checking your sign-in…
      </p>
    );
  }
  if (staff.step !== "ready") {
    return (
      <p role="status" className="text-slate p-8">
        Taking you to the sign-in page…
      </p>
    );
  }
  return <AdminShell staff={staff}>{children}</AdminShell>;
}
