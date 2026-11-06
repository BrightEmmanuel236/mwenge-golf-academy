import { describe, expect, it } from "vitest";

import { businessDaysSince, inboxKinds, isOverdue } from "@/lib/admin/inbox";

const enq = inboxKinds.enquiry;

describe("overdue rule (AC-E6: 2 business days)", () => {
  it("Monday submission is not overdue on Wednesday", () => {
    expect(isOverdue("new", "2026-11-02T07:00:00Z", enq, new Date("2026-11-04T12:00:00Z"))).toBe(false);
  });
  it("Monday submission is overdue on Thursday", () => {
    expect(isOverdue("new", "2026-11-02T07:00:00Z", enq, new Date("2026-11-05T12:00:00Z"))).toBe(true);
  });
  it("weekend days do not count", () => {
    // Friday -> following Tuesday = 2 business days (Mon, Tue)
    expect(businessDaysSince(new Date("2026-11-06T07:00:00Z"), new Date("2026-11-10T12:00:00Z"))).toBe(2);
  });
  it("an actioned submission is never overdue", () => {
    expect(isOverdue("contacted", "2026-10-01T07:00:00Z", enq, new Date("2026-11-05T12:00:00Z"))).toBe(false);
  });
  it("pledges use 'submitted' as the new status", () => {
    expect(isOverdue("submitted", "2026-10-01T07:00:00Z", inboxKinds.pledge, new Date("2026-11-05T12:00:00Z"))).toBe(true);
  });
});
