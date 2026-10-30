import type { TalentProfile } from "./consent";
import type {
  AcademyEvent,
  EquipmentNeed,
  ImpactFigure,
  NewsPost,
  Partner,
  Program,
} from "./types";
import type { MediaRef } from "./media";

/**
 * SAMPLE DATA FOR DESIGN ONLY.
 * Titles, summaries and dates below are placeholders so pages can be designed and reviewed.
 * They are not statements about the academy and must be replaced with client-approved content.
 * Anything marked `isSample` is excluded from production builds by the data layer's launch check.
 */
const placeholder = (src: string, alt: string, focal?: { x: number; y: number }): MediaRef => ({
  src,
  alt,
  source: "placeholder",
  ...(focal ? { focal } : {}),
});

export const programs: Program[] = [
  {
    slug: "sample-junior-program",
    title: "Junior program (sample)",
    audience: "junior",
    summary:
      "Sample summary. Replace with the academy’s approved description of its junior program.",
    description: [
      "Sample description. This paragraph stands in for the academy’s real program description so the page layout can be reviewed.",
      "Replace with approved wording covering what is taught, how sessions run and what young golfers can expect.",
    ],
    whoFor:
      "Sample audience note. Replace with the ages and experience levels the program is designed for.",
    priceUgx: null,
    priceUsd: null,
    image: placeholder(
      "/placeholders/practice-green.svg",
      "Abstract illustration of a putting green with a flag",
    ),
    status: "published",
    sortOrder: 1,
    isSample: true,
  },
  {
    slug: "sample-adult-program",
    title: "Adult program (sample)",
    audience: "adult",
    summary:
      "Sample summary. Replace with the academy’s approved description of its adult program.",
    description: ["Sample description. Replace with approved wording for the adult program."],
    priceUgx: null,
    priceUsd: null,
    image: placeholder(
      "/placeholders/fairway-dawn.svg",
      "Abstract illustration of a fairway at dawn",
    ),
    status: "published",
    sortOrder: 2,
    isSample: true,
  },
  {
    slug: "sample-corporate-program",
    title: "Corporate program (sample)",
    audience: "corporate",
    summary:
      "Sample summary. Replace with the academy’s approved description of its corporate offering.",
    description: [
      "Sample description. Replace with approved wording for corporate training and events.",
    ],
    priceUgx: null,
    priceUsd: null,
    image: placeholder("/placeholders/clubs-detail.svg", "Abstract illustration of golf clubs"),
    status: "published",
    sortOrder: 3,
    isSample: true,
  },
];

export const events: AcademyEvent[] = [
  {
    slug: "sample-outreach-day",
    title: "Outreach day (sample)",
    type: "outreach",
    startsAt: "2027-02-14T08:00:00+03:00",
    endsAt: "2027-02-14T13:00:00+03:00",
    venue: "Venue to be confirmed",
    summary: "Sample event used to design the events list. Replace with real event details.",
    image: placeholder(
      "/placeholders/fairway-dawn.svg",
      "Abstract illustration of a fairway at dawn",
    ),
    status: "published",
    isSample: true,
  },
];

export const news: NewsPost[] = [
  {
    slug: "sample-announcement",
    title: "Sample announcement",
    excerpt: "Sample excerpt used to design the news list. Replace with a real academy update.",
    category: "Academy news",
    publishedAt: "2026-10-01T09:00:00+03:00",
    image: placeholder(
      "/placeholders/practice-green.svg",
      "Abstract illustration of a putting green with a flag",
    ),
    status: "published",
    isSample: true,
  },
];

/** Unverified on purpose: nothing may be shown as an impact figure until the client verifies it. */
export const impactFigures: ImpactFigure[] = [
  {
    label: "Children trained",
    value: "To be confirmed",
    asAt: "2026-10-25",
    verified: false,
    displayOrder: 1,
  },
  {
    label: "Schools reached",
    value: "To be confirmed",
    asAt: "2026-10-25",
    verified: false,
    displayOrder: 2,
  },
];

export const equipmentNeeds: EquipmentNeed[] = [
  {
    item: "Junior golf clubs (sample)",
    description: "Sample need for design purposes.",
    quantityNeeded: 1,
    priority: "high",
    acceptedCondition: "Good condition or better",
    active: true,
    isSample: true,
  },
];

/** No partners until written permission is confirmed. */
export const partners: Partner[] = [];

/** No talent profiles until guardian consent is on file. We never invent profiles of children. */
export const talents: TalentProfile[] = [];
