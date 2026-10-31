import type { MediaRef } from "./media";

/** What a guardian has agreed may be published (PRD 5, workflow W5). */
export interface ConsentScope {
  displayName: boolean;
  photo: boolean;
  story: boolean;
  achievements: boolean;
  /** Permission for the individual page to be indexed by search engines. */
  searchIndexing: boolean;
}

export interface ConsentRecord {
  guardianName: string;
  relationship: string;
  signedOn: string; // ISO date
  expiresOn: string | null; // ISO date; null means reviewed on a fixed schedule
  withdrawnOn: string | null; // ISO date
  scope: ConsentScope;
  /** Reference to the signed form held in private storage. Never a public URL. */
  documentRef: string;
}

export function isConsentValid(
  consent: ConsentRecord | null | undefined,
  required: Array<keyof ConsentScope>,
  now: Date,
): boolean {
  if (!consent) return false;
  if (!consent.documentRef.trim()) return false;
  if (consent.withdrawnOn) return false;
  if (new Date(consent.signedOn).getTime() > now.getTime()) return false;
  if (consent.expiresOn && new Date(consent.expiresOn).getTime() <= now.getTime()) return false;
  return required.every((key) => consent.scope[key]);
}

export type TalentStatus = "draft" | "approved" | "published";

export interface TalentProfile {
  slug: string;
  /** First name plus initial or an agreed alias. Never a full name unless consent says so. */
  displayName: string;
  ageBand: string;
  story?: string;
  achievements: string[];
  photo?: MediaRef;
  consent: ConsentRecord | null;
  status: TalentStatus;
  /** Safeguarding Lead who approved publication. */
  approvedBy: string | null;
  isSample?: boolean;
}

/**
 * A talent profile is publishable only when a Safeguarding Lead has approved it AND a valid,
 * unexpired, unwithdrawn consent record covers every element that would be shown.
 */
export function canPublishTalent(profile: TalentProfile, now: Date): boolean {
  if (profile.status === "draft") return false;
  if (!profile.approvedBy) return false;
  const required: Array<keyof ConsentScope> = ["displayName"];
  if (profile.photo?.src) required.push("photo");
  if (profile.story) required.push("story");
  if (profile.achievements.length > 0) required.push("achievements");
  return isConsentValid(profile.consent, required, now);
}

/** Media showing minors needs a consent record covering photos. */
export function canPublishMinorMedia(
  media: MediaRef,
  consent: ConsentRecord | null,
  now: Date,
): boolean {
  if (!media.containsMinors) return true;
  return isConsentValid(consent, ["photo"], now);
}

/**
 * What a visitor may see of a talent profile. Built only from fields the guardian consented to.
 * It deliberately excludes the consent record (guardian name, document reference) and approver:
 * those must never be serialized into a public page.
 */
export interface PublicTalent {
  slug: string;
  displayName: string;
  ageBand: string;
  story?: string;
  achievements: string[];
  photo?: MediaRef;
  /** Whether search engines may index this individual page (needs explicit consent). */
  indexable: boolean;
}

export function toPublicTalent(profile: TalentProfile): PublicTalent {
  const scope = profile.consent?.scope;
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    ageBand: profile.ageBand,
    achievements: scope?.achievements ? [...profile.achievements] : [],
    indexable: scope?.searchIndexing === true,
    ...(scope?.story && profile.story ? { story: profile.story } : {}),
    ...(scope?.photo && profile.photo ? { photo: profile.photo } : {}),
  };
}
