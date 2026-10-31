/**
 * Forms are designed and validated on the front end but are not connected to storage or email
 * until the back-end phases. While this is false, a valid submission shows a clearly labelled
 * preview state and nothing is sent or saved.
 */
export const formsConnected = false;

/**
 * Online giving. While false, the donation form validates but never starts a payment and the
 * thank-you page does not claim a gift was received. Switch on only after a payment provider is
 * verified and server-side payment verification exists (PRD W2, SEC-7).
 */
export const paymentsConnected = false;
