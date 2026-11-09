import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginFlow } from "@/components/admin/login-flow";

export const Route = createFileRoute("/admin/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const done = React.useCallback(() => {
    void navigate({ to: "/admin", replace: true });
  }, [navigate]);
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-3xl">Staff sign-in</h1>
      <p className="text-slate mb-8">Mwenge Golf Academy staff only.</p>
      <LoginFlow onSignedIn={done} />
    </div>
  );
}
