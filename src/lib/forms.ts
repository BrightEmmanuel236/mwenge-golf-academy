/**
 * Whether the browser sends the four public forms (enquiry, contact, sponsor, pledge) to the server.
 * Off by default, so production keeps the clear "Preview only: nothing was sent" state until staff
 * notification exists (B1 plan, amendment 1). Turn on per environment with VITE_FORMS_MODE=save.
 * The server has its own switch (FORMS_SAVING_ENABLED), so a visitor is never told a message was
 * saved unless the server actually saved it. The donation form never uses this: see below.
 */
export const formsConnected = import.meta.env["VITE_FORMS_MODE"] === "save";

/**
 * Online giving. While false, the donation form validates but never starts a payment and the
 * thank-you page does not claim a gift was received. Switch on only after a payment provider is
 * verified and server-side payment verification exists (PRD W2, SEC-7).
 */
export const paymentsConnected = false;
