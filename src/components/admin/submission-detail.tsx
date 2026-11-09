import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import { formatKampala } from "@/lib/admin/format";
import { inboxKinds, isOverdue, statusLabel, type InboxKind } from "@/lib/admin/inbox";
import { getDetail, kindSlugs, loadHistory, NOTES_MAX, saveSubmission } from "@/lib/admin/queries";
import { OverdueBadge, RestrictedBadge, StatusBadge } from "./badges";

export function SubmissionDetail({ kind, reference }: { kind: InboxKind; reference: string }) {
  const cfg = inboxKinds[kind];
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["admin", "detail", kind, reference],
    queryFn: () => getDetail(kind, reference),
  });
  const history = useQuery({
    queryKey: ["admin", "history", reference],
    queryFn: () => loadHistory(reference),
  });

  const loaded = detail.data?.ok ? detail.data.data : null;
  const [status, setStatus] = React.useState("");
  const [notes, setNotes] = React.useState("");
  React.useEffect(() => {
    if (loaded) {
      setStatus(loaded.status);
      setNotes(loaded.notes);
    }
  }, [loaded?.status, loaded?.notes, loaded?.reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () => saveSubmission(kind, reference, { status, notes }),
    onSuccess: async (outcome) => {
      if (!outcome.ok) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "detail", kind, reference] }),
        client.invalidateQueries({ queryKey: ["admin", "history", reference] }),
        client.invalidateQueries({ queryKey: ["admin", "list"] }),
        client.invalidateQueries({ queryKey: ["admin", "counts"] }),
      ]);
    },
  });

  const back = (
    <Link
      to="/admin/$kind"
      params={{ kind: kindSlugs[kind] }}
      className="text-canopy text-sm underline underline-offset-4"
    >
      Back to {cfg.label.toLowerCase()}
    </Link>
  );

  if (detail.isPending) {
    return (
      <p role="status" className="text-slate">
        Loading…
      </p>
    );
  }
  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Alert tone="warning" title="Record not available">
          {detail.data && !detail.data.ok ? detail.data.message : "The record could not be loaded."}
        </Alert>
      </div>
    );
  }

  const result = save.data;
  const dirty = status !== loaded.status || notes !== loaded.notes;
  return (
    <article aria-labelledby="record-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {back}
        <h1 id="record-title" className="text-3xl">
          {loaded.reference}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={loaded.status} newStatus={cfg.newStatus} />
          {isOverdue(loaded.status, loaded.createdAt, cfg) ? <OverdueBadge /> : null}
          {loaded.restricted ? <RestrictedBadge /> : null}
          <span className="text-slate">
            Received {formatKampala(loaded.createdAt)} (Kampala time)
          </span>
        </p>
        {loaded.restricted ? (
          <Alert tone="warning" title="Safeguarding report">
            Only the Safeguarding Lead and the Super Administrator can see this. Handle it under the
            academy's safeguarding procedure.
          </Alert>
        ) : null}
      </div>

      <section aria-labelledby="details-title" className="flex flex-col gap-3">
        <h2 id="details-title" className="text-xl">
          Details
        </h2>
        {loaded.hasChildDetails ? (
          <Alert tone="info" title="Includes a child's details">
            Shown to staff only. They are never put in emails. Do not copy them elsewhere.
          </Alert>
        ) : null}
        <dl className="border-line grid gap-x-6 gap-y-3 rounded-md border bg-white p-5 sm:grid-cols-[14rem_1fr]">
          {loaded.fields.map((field) => (
            <React.Fragment key={field.label}>
              <dt className="text-slate text-sm">{field.label}</dt>
              <dd className="whitespace-pre-wrap">{field.value}</dd>
            </React.Fragment>
          ))}
        </dl>
        {loaded.items.length > 0 ? (
          <table className="border-line w-full border-collapse bg-white text-left text-sm">
            <caption className="text-slate p-2 text-left">Items offered</caption>
            <thead>
              <tr className="bg-sand text-fairway">
                <th scope="col" className="p-3">
                  Item
                </th>
                <th scope="col" className="p-3">
                  Quantity
                </th>
                <th scope="col" className="p-3">
                  Condition
                </th>
              </tr>
            </thead>
            <tbody>
              {loaded.items.map((item, index) => (
                <tr key={index} className="border-line border-t">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <form
        className="flex max-w-xl flex-col gap-5"
        aria-label="Update this record"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="text-xl">Work on this record</h2>
        <Field id="work-status" label="Status" required>
          {(control) => (
            <Select {...control} value={status} onChange={(e) => setStatus(e.target.value)}>
              {cfg.statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          id="work-notes"
          label="Internal notes"
          hint={`Staff only. Up to ${NOTES_MAX} characters.`}
        >
          {(control) => (
            <Textarea
              {...control}
              value={notes}
              maxLength={NOTES_MAX}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </Field>
        <div aria-live="polite">
          {result && !result.ok ? (
            <Alert tone="danger" title="Not saved">
              {result.message}
            </Alert>
          ) : result?.ok && !dirty ? (
            <p role="status" className="text-canopy font-medium">
              Saved.
            </p>
          ) : null}
          {save.isError ? (
            <Alert tone="danger" title="Not saved">
              Something went wrong. Nothing was changed.
            </Alert>
          ) : null}
        </div>
        <div>
          <Button
            type="submit"
            size="lg"
            disabled={save.isPending || !dirty}
            aria-busy={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="text-xl">
          History
        </h2>
        {history.data?.ok && history.data.data.history.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm">
            {history.data.data.history.map((entry, index) => (
              <li key={index} className="border-line rounded-md border bg-white p-3">
                <span className="text-slate">{formatKampala(entry.at)}</span> · {entry.actor}{" "}
                {entry.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate text-sm">No changes yet.</p>
        )}
      </section>

      {history.data?.ok && history.data.data.emails.length > 0 ? (
        <section aria-labelledby="emails-title" className="flex flex-col gap-3">
          <h2 id="emails-title" className="text-xl">
            Emails
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {history.data.data.emails.map((email, index) => (
              <li key={index}>
                {email.label}: <strong>{email.status}</strong>{" "}
                <span className="text-slate">({email.detail})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
