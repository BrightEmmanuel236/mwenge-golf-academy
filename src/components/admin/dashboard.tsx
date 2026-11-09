import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { inboxKinds, type InboxKind } from "@/lib/admin/inbox";
import { kindSlugs, loadCounts } from "@/lib/admin/queries";

export function Dashboard() {
  const counts = useQuery({ queryKey: ["admin", "counts"], queryFn: () => loadCounts() });
  const kinds = Object.keys(inboxKinds) as InboxKind[];
  return (
    <section aria-labelledby="dashboard-title" className="flex flex-col gap-6">
      <h1 id="dashboard-title" className="text-3xl">
        Dashboard
      </h1>
      <p className="text-slate measure">
        Overdue means still new after 2 business days (Monday to Friday, Kampala time).
      </p>
      {counts.isPending ? (
        <p role="status" className="text-slate">
          Loading…
        </p>
      ) : counts.isError ? (
        <Alert tone="danger" title="Could not load the counts">
          Try again in a moment.
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {kinds.map((kind) => {
            const count = counts.data[kind];
            return (
              <li key={kind} className="border-line rounded-md border bg-white p-5">
                <h2 className="text-xl">{inboxKinds[kind].label}</h2>
                {count ? (
                  <p className="mt-2">
                    <strong>{count.newCount}</strong> new
                    {count.overdueCount > 0 ? (
                      <>
                        {" · "}
                        <strong className="text-danger">{count.overdueCount} overdue</strong>
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-slate mt-2">Not available for your role.</p>
                )}
                <Link
                  to="/admin/$kind"
                  params={{ kind: kindSlugs[kind] }}
                  className="text-canopy mt-3 inline-block font-medium underline underline-offset-4"
                >
                  Open {inboxKinds[kind].label.toLowerCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
