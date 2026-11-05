import { z } from "zod";
import { emailField, honeypot, messageField, optionalPhone } from "./common";

/**
 * A safeguarding concern (PRD W10). Reporters may stay anonymous, so only the message is required.
 * There is no screen for this yet: the wording and the named Safeguarding Lead come from the client.
 */
export const safeguardingSchema = z.object({
  name: z.string().trim().max(120, { error: "Name must be 120 characters or fewer." }).optional(),
  email: z.union([z.literal(""), emailField]).optional(),
  phone: optionalPhone,
  message: messageField("Message", 3000),
  website: honeypot,
});
export type SafeguardingInput = z.infer<typeof safeguardingSchema>;
