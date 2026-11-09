import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { formatKampala } from "@/lib/admin/format";
import { inboxKinds, isOverdue, statusLabel, type InboxKind } from "@/lib/admin/inbox";
import { kindSlugs, listSubmissions, PAGE_SIZE } from "@/lib/admin/queries";
import { OverdueBadge, RestrictedBadge, StatusBadge } from "./badges";

export function SubmissionList({
  kind,
  status,
  page,
  onFilter,
  onPage,
}: {
  kind: InboxKind;
  status: string | undefined;
  page: number;
  onFilter: (status: string | undefined) => void;
  onPage: (page: number) => void;
}) {
  const cfg = inboxKinds[kind];
  const list = useQuery({
    queryKey: ["admin", "list", kind, status ?? "all", page],
    queryFn: () => listSubmissions(kind, { status, page }),
  });
  const result = list.data;
  const total = result?.ok ? result.data.total : 0;
  const first = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const last = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <section aria-labelledby="list-title" className="flex flex-col gap-5">
      <h1 id="list-title" className="text-3xl">
        {cfg.label}
      </h1>
      <div className="flex max-w-xs flex-col gap-2">
        <label htmlFor="status-filter" className="text-ink text-sm font-medium">
          Show
        </label>
        <Select
          id="status-filter"
          value={status ?? ""}
          onChange={(e) => onFilter(e.target.value || undefined)}
        >
          <option value="">All statuses</option>
          {cfg.statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {list.isPending ? (
        <p role="status" className="text-slate">
          Loading…
        </p>
      ) : list.isError || (result && !result.ok) ? (
        <Alert tone="danger" title="Could not load the list">
          {result && !result.ok ? result.message : "Try again in a moment."}
        </Alert>
      ) : result?.ok && result.data.rows.length === 0 ? (
        <p className="text-slate">Nothing to show here.</p>
      ) : result?.ok ? (
        <>
          <div className="overflow-x-auto">
            <table className="border-line w-full min-w-[40rem] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">
                {cfg.label}, newest first. Page {page + 1}.
              </caption>
              <thead>
                <tr className="bg-sand text-fairway">
                  <th scope="col" className="p-3">
                    Reference
                  </th>
                  <th scope="col" className="p-3">
                    From
                  </th>
                  <th scope="col" className="p-3">
                    About
                  </th>
                  <th scope="col" className="p-3">
                    Received (Kampala)
                  </th>
                  <th scope="col" className="p-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.rows.map((row) => (
                  <tr key={row.reference} className="border-line border-t">
                    <th scope="row" className="p-3 font-medium">
                      <Link
                        to="/admin/$kind/$reference"
                        params={{ kind: kindSlugs[kind], reference: row.reference }}
                        className="text-canopy underline underline-offset-4"
                      >
                        {row.reference}
                      </Link>
                    </th>
                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{row.summary}</td>
                    <td className="p-3">{formatKampala(row.createdAt)}</td>
                    <td className="p-3">
                      <span className="flex flex-wrap gap-2">
                        <StatusBadge status={row.status} newStatus={cfg.newStatus} />
                        {isOverdue(row.status, row.createdAt, cfg) ? <OverdueBadge /> : null}
                        {row.restricted ? <RestrictedBadge /> : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pages" className="flex items-center gap-3 text-sm">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <span aria-live="polite">
              {first}–{last} of {total}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={last >= total}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </nav>
        </>
      ) : null}
    </section>
  );
}
