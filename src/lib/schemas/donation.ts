import { z } from "zod";
import { currencies, currencyCodes } from "@/lib/money";
import {
  countryField,
  emailField,
  honeypot,
  nameField,
  optionalMessage,
  optionalPhone,
} from "./common";

export const donationPurposes = [
  "talent-development",
  "equipment",
  "outreach",
  "where-needed",
] as const;
export type DonationPurpose = (typeof donationPurposes)[number];

export const donationSchema = z
  .object({
    purpose: z.enum(donationPurposes, { error: "Choose where your gift should go." }),
    currency: z.enum(currencyCodes, { error: "Choose a currency." }),
    /** Integer minor units (UGX shillings, USD cents). */
    amountMinor: z
      .number({ error: "Enter an amount." })
      .int({ error: "Enter a valid amount." })
      .positive({ error: "Enter an amount." }),
    name: nameField,
    email: emailField,
    phone: optionalPhone,
    country: countryField,
    message: optionalMessage(500),
    anonymous: z.boolean().default(false),
    publicRecognition: z.boolean().default(false),
    marketingOptIn: z.boolean().default(false),
    website: honeypot,
  })
  .superRefine((value, ctx) => {
    const min = currencies[value.currency].minDonationMinor;
    if (value.amountMinor < min) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMinor"],
        message:
          value.currency === "UGX"
            ? `The minimum donation is UGX ${min.toLocaleString("en-UG")}.`
            : `The minimum donation is $${(min / 100).toFixed(0)}.`,
      });
    }
    if (value.anonymous && value.publicRecognition) {
      ctx.addIssue({
        code: "custom",
        path: ["publicRecognition"],
        message: "Choose either anonymous or public recognition, not both.",
      });
    }
  });
export type DonationInput = z.infer<typeof donationSchema>;
