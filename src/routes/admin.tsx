import * as React from "react";
import { createFileRoute, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { AdminGate } from "@/components/admin/admin-gate";
import { StaffProvider, useStaff } from "@/lib/admin/staff-context";
import { pageHead } from "@/lib/seo";

/** Staff area. Never indexed, never linked from the public site. */
export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead({
      title: "Staff area",
      description: "Staff only. Mwenge Golf Academy.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <StaffProvider>
      <AdminFrame />
    </StaffProvider>
  );
}

function AdminFrame() {
  const staff = useStaff();
  // From the matched screen, not the address: the address changes a moment before the screen does.
  const onLoginPage = useMatches({
    select: (matches) => matches.some((match) => match.routeId === "/admin/login"),
  });
  const navigate = useNavigate();
  const goToLogin = React.useCallback(() => {
    void navigate({ to: "/admin/login", replace: true });
  }, [navigate]);
  return (
    <AdminGate onLoginPage={onLoginPage} staff={staff} onNeedLogin={goToLogin}>
      <Outlet />
    </AdminGate>
  );
}
