/**
 * The emails themselves. Plain wording, no promises about timing, and nothing the sender typed ever
 * goes into a subject line. Child details are never present: this module only receives what
 * `get_submission_for_email` returns, which leaves them out on purpose (PRD §10.2).
 */

export type EmailTemplate = "staff_notification" | "sender_confirmation" | "safeguarding_alert";

export type SubmissionKind = "enquiry" | "contact" | "sponsor" | "pledge" | "safeguarding";

export interface SubmissionData {
  kind: SubmissionKind;
  reference: string;
  created_at: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  audience?: string | null;
  organization?: string | null;
  program_slug?: string | null;
  preferred_start?: string | null;
  is_junior?: boolean | null;
  guardian_relationship?: string | null;
  topic?: string | null;
  interests?: string[] | null;
  origin_country?: string | null;
  shipping_plan?: string | null;
  expected_date?: string | null;
  notes?: string | null;
  items?: { description: string; quantity: number; condition: string }[] | null;
}

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
}

const staffLabel: Record<SubmissionKind, string> = {
  enquiry: "enquiry",
  contact: "contact message",
  sponsor: "sponsor enquiry",
  pledge: "equipment pledge",
  safeguarding: "safeguarding concern",
};
const senderLabel: Record<SubmissionKind, string> = {
  enquiry: "enquiry",
  contact: "message",
  sponsor: "sponsorship enquiry",
  pledge: "equipment pledge",
  safeguarding: "report",
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const received = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kampala",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} (Kampala time)`;
};

type Row = [label: string, value: string];

const present = (rows: [string, string | null | undefined][]): Row[] =>
  rows.filter((row): row is Row => typeof row[1] === "string" && row[1].trim() !== "");

function detailsFor(data: SubmissionData): Row[] {
  const common = present([
    ["Reference", data.reference],
    ["Received", received(data.created_at)],
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
  ]);
  switch (data.kind) {
    case "enquiry":
      return [
        ...common,
        ...present([
          ["For", data.audience],
          ["Programme", data.program_slug],
          ["Organization", data.organization],
          ["Preferred start", data.preferred_start],
          ["Guardian relationship", data.is_junior ? data.guardian_relationship : null],
        ]),
      ];
    case "contact":
      return [...common, ...present([["About", data.topic]])];
    case "sponsor":
      return [
        ...common,
        ...present([
          ["Organization", data.organization],
          ["Interested in", data.interests?.join(", ")],
        ]),
      ];
    case "pledge":
      return [
        ...common,
        ...present([
          ["Organization", data.organization],
          ["Sending from", data.origin_country],
          ["Shipping", data.shipping_plan],
          ["Expected", data.expected_date],
          [
            "Items",
            data.items?.map((i) => `${i.quantity} x ${i.description} (${i.condition})`).join("; "),
          ],
        ]),
      ];
    case "safeguarding":
      return common;
  }
}

function layout(heading: string, rows: Row[], body: string | null, footer: string) {
  const text = [
    heading,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(body ? ["", body] : []),
    "",
    footer,
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:600px;line-height:1.5">
<h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(heading)}</h2>
<table style="border-collapse:collapse;width:100%">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>${
    body
      ? `<p style="white-space:pre-wrap;border-left:3px solid #c9972a;padding-left:12px;margin:16px 0">${escapeHtml(body)}</p>`
      : ""
  }<p style="color:#555;font-size:13px">${escapeHtml(footer)}</p></div>`;
  return { text, html };
}

export function buildEmail(template: EmailTemplate, data: SubmissionData): BuiltEmail {
  if (template === "sender_confirmation") {
    const heading = `We received your ${senderLabel[data.kind]}`;
    const body = [
      `Hello ${data.name},`,
      "",
      `Thank you for contacting Mwenge Golf Academy. We have received your ${senderLabel[data.kind]}.`,
      `Your reference is ${data.reference}. Please keep it if you contact us about this.`,
    ].join("\n");
    const footer = "This is an automated message.";
    const built = layout(heading, [], body, footer);
    return { subject: `${heading}: ${data.reference}`, ...built };
  }

  if (template === "safeguarding_alert") {
    const heading = "Safeguarding concern received";
    const built = layout(
      heading,
      detailsFor(data),
      data.message ?? null,
      "Please handle this under the academy's safeguarding procedure. This was sent only to the safeguarding contacts.",
    );
    return { subject: `${heading}: ${data.reference}`, ...built };
  }

  const heading = `New ${staffLabel[data.kind]}`;
  const footer =
    data.kind === "enquiry" && data.is_junior
      ? "Replying to this email reaches the sender. Details about the child are not included in email, for privacy; open the record to see them."
      : "Replying to this email reaches the sender.";
  const built = layout(heading, detailsFor(data), data.message ?? data.notes ?? null, footer);
  return { subject: `${heading}: ${data.reference}`, ...built };
}
