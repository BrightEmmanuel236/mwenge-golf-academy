import * as React from "react";
import { Alert } from "@/components/ui/alert";

/**
 * Shown only after the server confirms the submission was saved. Takes focus so keyboard and
 * screen-reader users land on the confirmation instead of an empty spot where the form was.
 */
export function SubmissionReceived({
  reference,
  title,
  children,
}: {
  reference: string;
  title: string;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div ref={ref} tabIndex={-1} className="outline-offset-4">
      <Alert tone="success" title={title}>
        <p>
          Your reference is <strong className="text-ink">{reference}</strong>. Please keep it if you
          contact the academy about this.
        </p>
        {children}
      </Alert>
    </div>
  );
}

/** Shown when a submission was not saved. Always says so plainly. What the visitor typed stays in the form. */
export function SubmitError({ message }: { message: string }) {
  return (
    <Alert tone="danger" title="Not sent">
      {message}
    </Alert>
  );
}
