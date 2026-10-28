import { z } from "zod";
import { emailField, honeypot, messageField, nameField, optionalPhone } from "./common";

export const contactTopics = [
  "training",
  "youth",
  "donation",
  "equipment",
  "partnership",
  "media",
  "other",
] as const;

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: optionalPhone,
  topic: z.enum(contactTopics, { error: "Choose what your message is about." }),
  message: messageField("Message", 2000),
  website: honeypot,
});
export type ContactInput = z.infer<typeof contactSchema>;
