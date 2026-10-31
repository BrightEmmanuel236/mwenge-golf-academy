import {
  canPublishMinorMedia,
  canPublishTalent,
  toPublicTalent,
  type PublicTalent,
  type TalentProfile,
} from "./consent";
import {
  equipmentNeeds,
  events,
  galleryItems,
  impactFigures,
  news,
  partners,
  programs,
  talents,
} from "./fixtures";
import { hasValidLicence, isAuthenticAcademyMedia } from "./media";
import type {
  AcademyEvent,
  EquipmentNeed,
  GalleryItem,
  ImpactFigure,
  NewsPost,
  Partner,
  Program,
} from "./types";

/**
 * Data-access layer. Pages call only these functions. In the back-end phase the bodies
 * change to Supabase queries; signatures and publication rules stay the same.
 */

export async function getPrograms(): Promise<Program[]> {
  return programs.filter((p) => p.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  return (await getPrograms()).find((p) => p.slug === slug) ?? null;
}

export async function getEvents(
  now: Date = new Date(),
): Promise<{ upcoming: AcademyEvent[]; past: AcademyEvent[] }> {
  const published = events.filter((e) => e.status === "published");
  const upcoming = published
    .filter((e) => new Date(e.endsAt) >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = published
    .filter((e) => new Date(e.endsAt) < now)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return { upcoming, past };
}

export async function getEventBySlug(slug: string): Promise<AcademyEvent | null> {
  return events.find((e) => e.status === "published" && e.slug === slug) ?? null;
}

export async function getAllNews(now: Date = new Date()): Promise<NewsPost[]> {
  return news
    .filter((n) => n.status === "published" && new Date(n.publishedAt) <= now)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNewsBySlug(
  slug: string,
  now: Date = new Date(),
): Promise<NewsPost | null> {
  return (await getAllNews(now)).find((n) => n.slug === slug) ?? null;
}

export async function getLatestNews(limit = 3, now: Date = new Date()): Promise<NewsPost[]> {
  return news
    .filter((n) => n.status === "published" && new Date(n.publishedAt) <= now)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

/** Only verified figures are ever returned. */
export async function getVerifiedImpactFigures(): Promise<ImpactFigure[]> {
  return impactFigures.filter((f) => f.verified).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getEquipmentNeeds(): Promise<EquipmentNeed[]> {
  return equipmentNeeds.filter((n) => n.active);
}

/** Partners appear only with written permission on record. */
export async function getPartners(): Promise<Partner[]> {
  return partners
    .filter((p) => p.permissionConfirmed)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Talent profiles appear only when approved and covered by valid consent. */
export async function getPublishedTalents(now: Date = new Date()): Promise<TalentProfile[]> {
  return talents.filter((t) => canPublishTalent(t, now));
}

export async function getTalentBySlug(
  slug: string,
  now: Date = new Date(),
): Promise<TalentProfile | null> {
  return (await getPublishedTalents(now)).find((t) => t.slug === slug) ?? null;
}

/** Public view of published talent profiles: no consent record, guardian or approver data. */
export async function getPublicTalents(now: Date = new Date()): Promise<PublicTalent[]> {
  return (await getPublishedTalents(now)).map(toPublicTalent);
}

export async function getPublicTalentBySlug(
  slug: string,
  now: Date = new Date(),
): Promise<PublicTalent | null> {
  const talent = await getTalentBySlug(slug, now);
  return talent ? toPublicTalent(talent) : null;
}

/**
 * Gallery items appear only when the image is authentic academy photography, any licence is
 * valid, and (for images showing minors) a valid guardian consent covers photographs.
 */
export function filterPublishableGallery(items: GalleryItem[], now: Date): GalleryItem[] {
  return items.filter(
    (item) =>
      isAuthenticAcademyMedia(item.media) &&
      hasValidLicence(item.media) &&
      canPublishMinorMedia(item.media, item.consent ?? null, now),
  );
}

export async function getGalleryItems(now: Date = new Date()): Promise<GalleryItem[]> {
  return filterPublishableGallery(galleryItems, now);
}

/** Items that must be replaced before launch; used by the launch checklist. */
export function listSampleContent(): string[] {
  return [
    ...programs.filter((p) => p.isSample).map((p) => `program:${p.slug}`),
    ...events.filter((e) => e.isSample).map((e) => `event:${e.slug}`),
    ...news.filter((n) => n.isSample).map((n) => `news:${n.slug}`),
    ...equipmentNeeds.filter((n) => n.isSample).map((n) => `equipment:${n.item}`),
  ];
}
