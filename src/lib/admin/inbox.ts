// B3-core staff inbox rules (PRD 8.3, AC-E5, AC-E6).

export type InboxKind = "enquiry" | "contact" | "sponsor" | "pledge";

export interface KindConfig {
  kind: InboxKind;
  label: string;
  table: "enquiry" | "contact_message" | "sponsor_enquiry" | "equipment_pledge";
  statuses: readonly string[];
  /** Status a submission arrives in; still in it after 2 business days = overdue. */
  newStatus: string;
}

export const inboxKinds: Record<InboxKind, KindConfig> = {
  enquiry: {
    kind: "enquiry",
    label: "Training enquiries",
    table: "enquiry",
    statuses: ["new", "contacted", "confirmed", "waitlisted", "declined", "closed"],
    newStatus: "new",
  },
  contact: {
    kind: "contact",
    label: "Contact messages",
    table: "contact_message",
    statuses: ["new", "replied", "closed"],
    newStatus: "new",
  },
  sponsor: {
    kind: "sponsor",
    label: "Sponsor enquiries",
    table: "sponsor_enquiry",
    statuses: ["new", "in_discussion", "agreed", "not_proceeding"],
    newStatus: "new",
  },
  pledge: {
    kind: "pledge",
    label: "Equipment pledges",
    table: "equipment_pledge",
    statuses: [
      "submitted",
      "accepted",
      "needs_changes",
      "declined",
      "in_transit",
      "received",
      "distributed",
    ],
    newStatus: "submitted",
  },
};

export function isInboxKind(v: string): v is InboxKind {
  return v in inboxKinds;
}

export function statusLabel(s: string) {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function kampalaDay(d: Date) {
  // Kampala is UTC+3 all year (no daylight saving).
  const k = new Date(d.getTime() + 3 * 3600_000);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
}

/** Whole Mon–Fri days that have passed since `from`, in Kampala time. */
export function businessDaysSince(from: Date, now: Date) {
  let day = kampalaDay(from);
  const end = kampalaDay(now);
  let n = 0;
  while (day < end) {
    day = new Date(day.getTime() + 86400_000);
    const wd = day.getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

/** AC-E6: not actioned within 2 business days. */
export function isOverdue(status: string, createdAt: string | Date, cfg: KindConfig, now = new Date()) {
  return status === cfg.newStatus && businessDaysSince(new Date(createdAt), now) > 2;
}
