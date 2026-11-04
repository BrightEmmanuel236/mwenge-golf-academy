import { submitForm } from "@/lib/submit.functions";
import { failureMessages, type SubmissionKind, type SubmitResult } from "@/lib/submissions";

/** Browser side of saving a form. A network or server crash is reported as "not sent", never as success. */
export async function sendSubmission(kind: SubmissionKind, data: unknown): Promise<SubmitResult> {
  try {
    return await submitForm({ data: { kind, data } });
  } catch {
    return { ok: false, reason: "unavailable", message: failureMessages.unavailable };
  }
}
