import { describe, expect, it } from "vitest";
import {
  canPublishMinorMedia,
  canPublishTalent,
  isConsentValid,
  type ConsentRecord,
  type TalentProfile,
} from "@/lib/content/consent";
import {
  getPartners,
  getPublishedTalents,
  getVerifiedImpactFigures,
  listSampleContent,
} from "@/lib/content";
import { hasValidLicence, isAuthenticAcademyMedia, type MediaRef } from "@/lib/content/media";

const now = new Date("2026-11-01T00:00:00Z");

const fullScope = {
  displayName: true,
  photo: true,
  story: true,
  achievements: true,
  searchIndexing: false,
};
const consent = (overrides: Partial<ConsentRecord> = {}): ConsentRecord => ({
  guardianName: "Test Guardian",
  relationship: "Parent",
  signedOn: "2026-10-01",
  expiresOn: "2027-10-01",
  withdrawnOn: null,
  scope: fullScope,
  documentRef: "consent/doc-1",
  ...overrides,
});

const profile = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  slug: "test",
  displayName: "Sam K.",
  ageBand: "10 to 12",
  story: "Story",
  achievements: ["Achievement"],
  photo: { src: "/x.jpg", alt: "x", source: "academy", containsMinors: true },
  consent: consent(),
  status: "approved",
  approvedBy: "Safeguarding Lead",
  ...overrides,
});

describe("consent validity", () => {
  it("accepts valid, in-date consent covering the required scope", () => {
    expect(isConsentValid(consent(), ["displayName", "photo"], now)).toBe(true);
  });

  it("rejects missing, withdrawn, expired, future-dated or undocumented consent", () => {
    expect(isConsentValid(null, ["displayName"], now)).toBe(false);
    expect(isConsentValid(consent({ withdrawnOn: "2026-10-20" }), ["displayName"], now)).toBe(
      false,
    );
    expect(isConsentValid(consent({ expiresOn: "2026-10-15" }), ["displayName"], now)).toBe(false);
    expect(isConsentValid(consent({ signedOn: "2026-12-01" }), ["displayName"], now)).toBe(false);
    expect(isConsentValid(consent({ documentRef: " " }), ["displayName"], now)).toBe(false);
  });

  it("rejects consent that does not cover every required element", () => {
    const noPhoto = consent({ scope: { ...fullScope, photo: false } });
    expect(isConsentValid(noPhoto, ["displayName", "photo"], now)).toBe(false);
  });
});

describe("talent publication gate", () => {
  it("publishes only when approved and fully covered by valid consent", () => {
    expect(canPublishTalent(profile(), now)).toBe(true);
  });

  it("blocks drafts, unapproved profiles and invalid consent", () => {
    expect(canPublishTalent(profile({ status: "draft" }), now)).toBe(false);
    expect(canPublishTalent(profile({ approvedBy: null }), now)).toBe(false);
    expect(canPublishTalent(profile({ consent: null }), now)).toBe(false);
    expect(
      canPublishTalent(profile({ consent: consent({ withdrawnOn: "2026-10-30" }) }), now),
    ).toBe(false);
  });

  it("blocks a profile whose consent does not cover its photo", () => {
    const noPhotoConsent = consent({ scope: { ...fullScope, photo: false } });
    expect(canPublishTalent(profile({ consent: noPhotoConsent }), now)).toBe(false);
  });

  it("blocks minor media without consent", () => {
    const media: MediaRef = { src: "/x.jpg", alt: "x", source: "academy", containsMinors: true };
    expect(canPublishMinorMedia(media, null, now)).toBe(false);
    expect(canPublishMinorMedia(media, consent(), now)).toBe(true);
    expect(canPublishMinorMedia({ ...media, containsMinors: false }, null, now)).toBe(true);
  });
});

describe("media rules", () => {
  it("allows only authentic academy images where real activity is implied", () => {
    expect(isAuthenticAcademyMedia({ src: "/a.jpg", alt: "a", source: "academy" })).toBe(true);
    expect(isAuthenticAcademyMedia({ src: "/a.jpg", alt: "a", source: "licensed" })).toBe(false);
    expect(isAuthenticAcademyMedia({ src: "/a.jpg", alt: "a", source: "placeholder" })).toBe(false);
  });

  it("requires a credit and licence reference for licensed imagery", () => {
    expect(hasValidLicence({ src: "/a.jpg", alt: "a", source: "licensed" })).toBe(false);
    expect(
      hasValidLicence({
        src: "/a.jpg",
        alt: "a",
        source: "licensed",
        credit: "Photographer",
        licenseRef: "L-1",
      }),
    ).toBe(true);
  });
});

describe("data layer publication rules", () => {
  it("returns no unverified impact figures", async () => {
    expect(await getVerifiedImpactFigures()).toEqual([]);
  });

  it("returns no partners without confirmed permission, and no unconsented talent", async () => {
    expect(await getPartners()).toEqual([]);
    expect(await getPublishedTalents(now)).toEqual([]);
  });

  it("tracks sample content that must be replaced before launch", () => {
    expect(listSampleContent().length).toBeGreaterThan(0);
  });
});
