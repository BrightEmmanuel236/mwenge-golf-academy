import { describe, expect, it } from "vitest";
import { getEvents, getPrograms } from "@/lib/content";
import { formatDate, formatDayMonth, programPrice } from "@/lib/format";
import { footerNav, primaryNav, supportNav, isGroup } from "@/lib/site";

describe("formatting", () => {
  it("shows 'Contact us for pricing' until the academy supplies prices", () => {
    expect(programPrice({ priceUgx: null, priceUsd: null })).toBe("Contact us for pricing");
  });

  it("formats supplied prices in both currencies", () => {
    const text = programPrice({ priceUgx: 250_000, priceUsd: 7_500 });
    expect(text).toContain("250,000");
    expect(text).toContain("75");
    expect(text.startsWith("From ")).toBe(true);
  });

  it("formats dates in East Africa Time, not UTC", () => {
    // 23:30 UTC on 14 Feb is already 15 Feb in Kampala.
    expect(formatDate("2027-02-14T23:30:00Z")).toBe("15 February 2027");
    expect(formatDayMonth("2027-02-14T23:30:00Z")).toEqual({ day: "15", month: "Feb" });
  });
});

describe("published content integrity", () => {
  it("every program has a unique slug and descriptive alt text", async () => {
    const programs = await getPrograms();
    expect(new Set(programs.map((p) => p.slug)).size).toBe(programs.length);
    for (const program of programs) {
      expect(program.image.alt.trim().length, program.slug).toBeGreaterThan(10);
    }
  });

  it("splits events into upcoming and past using the supplied date", async () => {
    const before = await getEvents(new Date("2027-01-01T00:00:00Z"));
    const after = await getEvents(new Date("2028-01-01T00:00:00Z"));
    expect(before.upcoming.length).toBeGreaterThan(0);
    expect(after.upcoming).toHaveLength(0);
    expect(after.past.length).toBe(before.upcoming.length + before.past.length);
  });
});

describe("navigation", () => {
  it("only links to site-relative paths and has no duplicate primary destinations", () => {
    const hrefs: string[] = [];
    for (const item of primaryNav) {
      if (isGroup(item)) hrefs.push(...item.children.map((c) => c.href));
      else hrefs.push(item.href);
    }
    hrefs.push(...supportNav.map((l) => l.href), ...footerNav.legal.map((l) => l.href));
    for (const href of hrefs) expect(href.startsWith("/"), href).toBe(true);
    const primary = primaryNav.flatMap((i) =>
      isGroup(i) ? i.children.map((c) => c.href) : [i.href],
    );
    expect(new Set(primary).size).toBe(primary.length);
  });
});
