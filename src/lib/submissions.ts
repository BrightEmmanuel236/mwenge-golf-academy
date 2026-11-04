/** Shared (client-safe) types and wording for saving the public forms. PRD W1, W3, W4, W9; SEC-3, SEC-6. */

export const submissionKinds = ["enquiry", "contact", "sponsor", "pledge"] as const;
export type SubmissionKind = (typeof submissionKinds)[number];

export type SubmitFailureReason = "invalid" | "rate_limited" | "unavailable" | "disabled";

export type SubmitFailure = {
  ok: false;
  reason: SubmitFailureReason;
  /** Plain-language message safe to show a visitor. Never contains internal detail. */
  message: string;
  /** Field errors keyed like the client form's own errors (e.g. "items.0.description"). */
  fieldErrors?: Record<string, string>;
};

export type SubmitResult = { ok: true; reference: string } | SubmitFailure;

/** Every failure says plainly that nothing was saved, so a visitor never assumes it was. */
export const failureMessages: Record<SubmitFailureReason, string> = {
  invalid: "Some details need fixing. Nothing was sent.",
  rate_limited:
    "Too many submissions from this address in a short time. Nothing was sent. Please wait a few minutes and try again.",
  unavailable: "Something went wrong on our side. Nothing was sent. Please try again in a moment.",
  disabled: "Sending is not switched on for this site yet. Nothing was sent.",
};
