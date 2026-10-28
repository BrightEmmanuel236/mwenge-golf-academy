import { z } from "zod";

const trimmed = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} must be ${max} characters or fewer.` });

export const nameField = trimmed("Name", 120);
export const emailField = z
  .string({ error: "Email address is required." })
  .trim()
  .toLowerCase()
  .max(254, { error: "Email address is too long." })
  .pipe(z.email({ error: "Enter a valid email address." }));

/** Accepts local and international formats; normalised formatting is applied server-side later. */
export const phoneField = z
  .string()
  .trim()
  .max(30, { error: "Phone number is too long." })
  .regex(/^[+\d][\d\s()-]{5,}$/, { error: "Enter a valid phone number." });

export const optionalPhone = z.union([z.literal(""), phoneField]).optional();

export const messageField = (label = "Message", max = 2000) => trimmed(label, max);
export const optionalMessage = (max = 2000) => z.string().trim().max(max).optional();

export const countryField = trimmed("Country", 80);

/** Honeypot: real users leave this empty. Bot protection (Turnstile) is added in the back-end phase. */
export const honeypot = z.string().max(0).optional();
