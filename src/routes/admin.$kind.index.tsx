import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert } from "@/components/ui/alert";
import { SubmissionList } from "@/components/admin/submission-list";
import { kindFromSlug } from "@/lib/admin/queries";

export const Route = createFileRoute("/admin/$kind/")({
  validateSearch: (search: Record<string, unknown>): { status?: string; page?: number } => {
    const page = Number(search["page"]);
    return {
      ...(typeof search["status"] === "string" && search["status"]
        ? { status: search["status"] }
        : {}),
      ...(Number.isInteger(page) && page > 0 ? { page } : {}),
    };
  },
  component: KindPage,
});

function KindPage() {
  const { kind: slug } = Route.useParams();
  const { status, page } = Route.useSearch();
  const navigate = useNavigate();
  const kind = kindFromSlug(slug);
  if (!kind) {
    return (
      <Alert tone="warning" title="Unknown list">
        That list does not exist.
      </Alert>
    );
  }
  return (
    <SubmissionList
      kind={kind}
      status={status}
      page={page ?? 0}
      onFilter={(next) =>
        void navigate({
          to: "/admin/$kind",
          params: { kind: slug },
          search: next ? { status: next } : {},
        })
      }
      onPage={(next) =>
        void navigate({
          to: "/admin/$kind",
          params: { kind: slug },
          search: { ...(status ? { status } : {}), ...(next > 0 ? { page: next } : {}) },
        })
      }
    />
  );
}
