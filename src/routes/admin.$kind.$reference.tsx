import { createFileRoute } from "@tanstack/react-router";
import { Alert } from "@/components/ui/alert";
import { SubmissionDetail } from "@/components/admin/submission-detail";
import { kindFromSlug } from "@/lib/admin/queries";

export const Route = createFileRoute("/admin/$kind/$reference")({ component: RecordPage });

function RecordPage() {
  const { kind: slug, reference } = Route.useParams();
  const kind = kindFromSlug(slug);
  if (!kind) {
    return (
      <Alert tone="warning" title="Unknown list">
        That list does not exist.
      </Alert>
    );
  }
  return <SubmissionDetail kind={kind} reference={reference} />;
}
