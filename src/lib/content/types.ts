import type { ConsentRecord } from "./consent";
import type { MediaRef } from "./media";

export type Audience = "junior" | "adult" | "corporate";
export type PublishStatus = "draft" | "published";

export interface Program {
  slug: string;
  title: string;
  audience: Audience;
  summary: string;
  /** Longer description, one paragraph per entry. */
  description?: string[];
  whoFor?: string;
  level?: string;
  duration?: string;
  schedulePattern?: string;
  venue?: string;
  /** Integer minor units. `null` renders "Contact us for pricing". */
  priceUgx: number | null;
  priceUsd: number | null;
  image: MediaRef;
  status: PublishStatus;
  sortOrder: number;
  isSample?: boolean;
}

export type EventType = "tournament" | "outreach" | "clinic" | "fundraiser";

export interface AcademyEvent {
  slug: string;
  title: string;
  type: EventType;
  startsAt: string; // ISO
  endsAt: string; // ISO
  venue: string;
  summary: string;
  image: MediaRef;
  status: PublishStatus;
  isSample?: boolean;
}

export interface NewsPost {
  slug: string;
  title: string;
  excerpt: string;
  /** Article body, one paragraph per entry. */
  body?: string[];
  category: string;
  publishedAt: string; // ISO
  image: MediaRef;
  status: PublishStatus;
  isSample?: boolean;
}

export interface Partner {
  name: string;
  type: "sponsor" | "partner" | "supporter";
  website?: string;
  description?: string;
  logo?: MediaRef;
  /** Written permission to display the name and logo. Publication is blocked without it. */
  permissionConfirmed: boolean;
  displayOrder: number;
}

export interface ImpactFigure {
  label: string;
  value: string;
  asAt: string; // ISO date
  /** Only verified figures render (PRD 4.1, 4.5). */
  verified: boolean;
  sourceNote?: string;
  displayOrder: number;
}

export interface EquipmentNeed {
  item: string;
  description?: string;
  quantityNeeded: number;
  priority: "high" | "medium" | "low";
  acceptedCondition: string;
  active: boolean;
  isSample?: boolean;
}

/** A photograph or video in the gallery. Only authentic academy media is ever published here. */
export interface GalleryItem {
  id: string;
  album: string;
  media: MediaRef;
  takenOn?: string; // ISO date
  eventSlug?: string;
  /** Consent record covering this image when it shows a minor. */
  consent?: ConsentRecord | null;
}
