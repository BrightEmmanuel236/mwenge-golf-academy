import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut, type StaffRole } from "@/lib/admin/auth";
import type { StaffState } from "@/lib/admin/staff-context";

const roleLabels: Record<StaffRole, string> = {
  super_admin: "Super administrator",
  academy_admin: "Academy administrator",
  content_manager: "Content manager",
  safeguarding_lead: "Safeguarding lead",
};

const navClass =
  "rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2";

/** Frame for every signed-in staff screen. The public site's header and footer are not shown here. */
export function AdminShell({ staff, children }: { staff: StaffState; children: React.ReactNode }) {
  const canWorkSubmissions = staff.roles.some((role) => role !== "content_manager");
  return (
    <div className="bg-ivory min-h-dvh">
      <header className="bg-fairway text-ivory">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="font-display text-lg">Mwenge Golf Academy · Staff area</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{staff.email}</span>
            {staff.roles.map((role) => (
              <Badge key={role} variant="outline" className="border-ivory/50 text-ivory">
                {roleLabels[role]}
              </Badge>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await signOut();
                await staff.refresh();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      {canWorkSubmissions ? (
        <nav aria-label="Staff area" className="border-line border-b bg-white">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-6 py-2">
            <li>
              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                className={navClass}
                activeProps={{ "aria-current": "page", className: `${navClass} bg-sand` }}
              >
                Dashboard
              </Link>
            </li>
            {[
              ["enquiries", "Training enquiries"],
              ["messages", "Messages"],
              ["sponsors", "Sponsors"],
              ["pledges", "Equipment pledges"],
            ].map(([slug, label]) => (
              <li key={slug}>
                <Link
                  to="/admin/$kind"
                  params={{ kind: slug as string }}
                  className={navClass}
                  activeProps={{ "aria-current": "page", className: `${navClass} bg-sand` }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {staff.roles.length === 0 ? (
          <Alert tone="warning" title="No staff role on this account">
            You are signed in, but this account has not been given a staff role yet. Ask the super
            administrator to assign one.
          </Alert>
        ) : !canWorkSubmissions ? (
          <Alert tone="info" title="Your role does not include submissions">
            Content managers do not see enquiries, messages, sponsors or pledges.
          </Alert>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
