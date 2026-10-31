import { describe, expect, it } from "vitest";
import { toPublicTalent, type ConsentRecord, type TalentProfile } from "@/lib/content/consent";
import {
  filterPublishableGallery,
  getGalleryItems,
  getNewsBySlug,
  getPublicTalentBySlug,
  getPublicTalents,
  getEventBySlug,
} from "@/lib/content";
import { legalPages } from "@/lib/content/pages";
import type { GalleryItem } from "@/lib/content/types";
import { formatEventWhen } from "@/lib/format";
import { footerNav } from "@/lib/site";

const now = new Date("2026-11-01T00:00:00Z");
const scope = {
  displayName: true,
  photo: true,
  story: true,
  achievements: true,
  searchIndexing: false,
};
const consent = (overrides: Partial<ConsentRecord> = {}): ConsentRecord => ({
  guardianName: "Private Guardian Name",
  relationship: "Parent",
  signedOn: "2026-10-01",
  expiresOn: "2027-10-01",
  withdrawnOn: null,
  scope,
  documentRef: "private/consent-doc-123",
  ...overrides,
});
const talent = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  slug: "sam-k",
  displayName: "Sam K.",
  ageBand: "10 to 12",
  story: "A short story.",
  achievements: ["First achievement"],
  photo: { src: "/p.jpg", alt: "Sam K. at practice", source: "academy", containsMinors: true },
  consent: consent(),
  status: "published",
  approvedBy: "Safeguarding Lead",
  ...overrides,
});

describe("public talent projection (privacy)", () => {
  it("never exposes guardian, consent document or approver data", () => {
    const json = JSON.stringify(toPublicTalent(talent()));
    expect(json).not.toContain("Private Guardian Name");
    expect(json).not.toContain("consent-doc-123");
    expect(json).not.toContain("Safeguarding Lead");
    expect(json).not.toContain("guardianName");
    expect(json).not.toContain("documentRef");
    expect(json).not.toContain("consent");
  });

  it("omits story, photo and achievements the guardian did not consent to show", () => {
    const limited = consent({
      scope: { ...scope, story: false, photo: false, achievements: false },
    });
    const view = toPublicTalent(talent({ consent: limited }));
    expect(view.story).toBeUndefined();
    expect(view.photo).toBeUndefined();
    expect(view.achievements).toEqual([]);
  });

  it("is not indexable unless the guardian agreed to search indexing", () => {
    expect(toPublicTalent(talent()).indexable).toBe(false);
    const agreed = consent({ scope: { ...scope, searchIndexing: true } });
    expect(toPublicTalent(talent({ consent: agreed })).indexable).toBe(true);
  });

  it("returns no public talent while no consented profile exists", async () => {
    expect(await getPublicTalents(now)).toEqual([]);
    expect(await getPublicTalentBySlug("anything", now)).toBeNull();
  });
});

describe("gallery publication rules", () => {
  const item = (
    id: string,
    media: GalleryItem["media"],
    consentRecord?: ConsentRecord | null,
  ): GalleryItem => ({
    id,
    album: "Test",
    media,
    ...(consentRecord !== undefined ? { consent: consentRecord } : {}),
  });
  const academy = { src: "/a.jpg", alt: "Academy photo", source: "academy" as const };

  it("publishes authentic academy photographs that show no minors", () => {
    expect(filterPublishableGallery([item("a", academy)], now)).toHaveLength(1);
  });

  it("never publishes stock (licensed) or placeholder images", () => {
    const licensed = {
      ...academy,
      source: "licensed" as const,
      credit: "Photographer",
      licenseRef: "L-1",
    };
    const placeholder = { ...academy, source: "placeholder" as const };
    expect(filterPublishableGallery([item("l", licensed), item("p", placeholder)], now)).toEqual(
      [],
    );
  });

  it("blocks images of minors without valid consent, and allows them with it", () => {
    const minor = { ...academy, containsMinors: true };
    expect(filterPublishableGallery([item("m1", minor)], now)).toEqual([]);
    expect(filterPublishableGallery([item("m2", minor, null)], now)).toEqual([]);
    expect(
      filterPublishableGallery([item("m3", minor, consent({ withdrawnOn: "2026-10-20" }))], now),
    ).toEqual([]);
    expect(
      filterPublishableGallery(
        [item("m4", minor, consent({ scope: { ...scope, photo: false } }))],
        now,
      ),
    ).toEqual([]);
    expect(filterPublishableGallery([item("m5", minor, consent())], now)).toHaveLength(1);
  });

  it("the live gallery is empty until real, consented photographs exist", async () => {
    expect(await getGalleryItems(now)).toEqual([]);
  });
});

describe("events, news and legal content", () => {
  it("looks events and news up by slug, and returns null for unknown slugs", async () => {
    expect((await getEventBySlug("sample-outreach-day"))?.title).toContain("Outreach day");
    expect(await getEventBySlug("nope")).toBeNull();
    expect((await getNewsBySlug("sample-announcement", now))?.body?.length).toBeGreaterThan(0);
    expect(await getNewsBySlug("nope", now)).toBeNull();
  });

  it("does not show a news post before its publish date", async () => {
    expect(await getNewsBySlug("sample-announcement", new Date("2026-09-01T00:00:00Z"))).toBeNull();
  });

  it("every footer legal link has a page definition with a non-empty outline", () => {
    const slugs = new Set(legalPages.map((page) => page.slug));
    for (const link of footerNav.legal) {
      const slug = link.href.replace("/legal/", "");
      expect(slugs.has(slug as (typeof legalPages)[number]["slug"]), link.href).toBe(true);
    }
    for (const page of legalPages) expect(page.outline.length, page.slug).toBeGreaterThan(1);
  });

  it("formats an event's date and time range in East Africa Time", () => {
    expect(formatEventWhen("2027-02-14T08:00:00+03:00", "2027-02-14T13:00:00+03:00")).toBe(
      "14 February 2027, 8:00 am to 1:00 pm",
    );
    expect(formatEventWhen("2027-02-14T08:00:00+03:00", "2027-02-15T10:00:00+03:00")).toBe(
      "14 February 2027, 8:00 am to 15 February 2027, 10:00 am",
    );
  });
});
