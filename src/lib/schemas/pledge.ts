import { z } from "zod";
import {
  countryField,
  emailField,
  honeypot,
  nameField,
  optionalMessage,
  optionalPhone,
} from "./common";

export const equipmentConditions = ["new", "like-new", "good", "fair"] as const;

export const pledgeItemSchema = z.object({
  description: z.string().trim().min(1, { error: "Describe the item." }).max(200),
  quantity: z
    .number({ error: "Enter a quantity." })
    .int({ error: "Quantity must be a whole number." })
    .min(1, { error: "Quantity must be at least 1." })
    .max(10_000),
  condition: z.enum(equipmentConditions, { error: "Choose the condition." }),
});

export const pledgeSchema = z.object({
  name: nameField,
  organization: z.string().trim().max(160).optional(),
  email: emailField,
  phone: optionalPhone,
  originCountry: countryField,
  shippingPlan: z.enum(["donor-ships", "needs-help", "undecided"], {
    error: "Tell us how the items would reach Uganda.",
  }),
  expectedDate: z.string().trim().max(60).optional(),
  items: z.array(pledgeItemSchema).min(1, { error: "Add at least one item." }).max(30),
  notes: optionalMessage(1500),
  recognitionOptIn: z.boolean().default(false),
  website: honeypot,
});
export type PledgeInput = z.infer<typeof pledgeSchema>;
