import { z } from "zod";
import { emailField, honeypot, messageField, nameField, optionalPhone, phoneField } from "./common";

export const audienceTypes = ["adult", "corporate", "junior"] as const;
export type AudienceType = (typeof audienceTypes)[number];

const base = {
  programSlug: z.string().trim().min(1).max(120).optional(),
  name: nameField,
  email: emailField,
  phone: phoneField,
  preferredStart: z.string().trim().max(120).optional(),
  message: messageField("Message", 1500),
  website: honeypot,
};

const adult = z.object({ ...base, audience: z.literal("adult") });

const corporate = z.object({
  ...base,
  audience: z.literal("corporate"),
  organization: z.string().trim().min(1, { error: "Organization name is required." }).max(160),
});

/**
 * Junior enquiries are submitted by a parent or guardian. We collect only the child's
 * first name and age; never a child's own email or phone number (PRD 10.2).
 */
const junior = z.object({
  ...base,
  audience: z.literal("junior"),
  guardianRelationship: z
    .string()
    .trim()
    .min(1, { error: "Tell us your relationship to the child." })
    .max(60),
  childFirstName: z.string().trim().min(1, { error: "Child's first name is required." }).max(60),
  childAge: z
    .number({ error: "Enter the child's age." })
    .int({ error: "Age must be a whole number." })
    .min(4, { error: "Junior programs are for ages 4 to 17." })
    .max(17, { error: "Junior programs are for ages 4 to 17." }),
  guardianDeclaration: z.literal(true, {
    error: "Confirm that you are the child's parent or guardian.",
  }),
});

export const enquirySchema = z.discriminatedUnion("audience", [adult, corporate, junior]);
export type EnquiryInput = z.infer<typeof enquirySchema>;
export { optionalPhone };
