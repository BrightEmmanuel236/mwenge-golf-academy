import { canPublishTalent, type TalentProfile } from "./consent";
import {
  equipmentNeeds,
  events,
  impactFigures,
  news,
  partners,
  programs,
  talents,
} from "./fixtures";
import type {
  AcademyEvent,
  EquipmentNeed,
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

/** Items that must be replaced before launch; used by the launch checklist. */
export function listSampleContent(): string[] {
  return [
    ...programs.filter((p) => p.isSample).map((p) => `program:${p.slug}`),
    ...events.filter((e) => e.isSample).map((e) => `event:${e.slug}`),
    ...news.filter((n) => n.isSample).map((n) => `news:${n.slug}`),
    ...equipmentNeeds.filter((n) => n.isSample).map((n) => `equipment:${n.item}`),
  ];
}
