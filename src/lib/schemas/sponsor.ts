import { z } from "zod";
import { emailField, honeypot, messageField, nameField, optionalPhone } from "./common";

export const sponsorInterests = [
  "event-sponsorship",
  "program-sponsorship",
  "equipment-partnership",
  "corporate-training",
  "other",
] as const;

export const sponsorSchema = z.object({
  organization: z.string().trim().min(1, { error: "Organization name is required." }).max(160),
  name: nameField,
  email: emailField,
  phone: optionalPhone,
  interests: z
    .array(z.enum(sponsorInterests))
    .min(1, { error: "Choose at least one area of interest." }),
  message: messageField("Message", 2000),
  website: honeypot,
});
export type SponsorInput = z.infer<typeof sponsorSchema>;
