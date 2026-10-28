/**
 * Site-wide configuration. Anything not yet supplied by the client is `null`
 * and must not render until it is provided (no invented contact details).
 */
export const site = {
  name: "Mwenge Golf Academy",
  shortName: "Mwenge",
  descriptor: "Golf Academy",
  tagline: "A grassroots golf and youth-development initiative in Uganda.",
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://mwenge-golf-academy.lovable.app",
  locale: "en",
  contact: {
    email: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    address: null as string | null,
  },
  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    x: null as string | null,
    youtube: null as string | null,
    linkedin: null as string | null,
  },
} as const;

export type NavLinkItem = { label: string; href: string; description?: string };
export type NavGroupItem = { label: string; children: NavLinkItem[] };
export type NavItem = NavLinkItem | NavGroupItem;

export function isGroup(item: NavItem): item is NavGroupItem {
  return "children" in item;
}

/** Primary navigation (PRD Section 3.2). */
export const primaryNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Programs", href: "/programs" },
  { label: "Youth Development", href: "/youth-development" },
  { label: "Impact", href: "/impact" },
  { label: "Events & Outreach", href: "/events" },
  {
    label: "Media",
    children: [
      { label: "News", href: "/news", description: "Announcements and stories" },
      { label: "Gallery", href: "/gallery", description: "Photographs from the academy" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

/** "Support Us" menu: the secondary call to action. */
export const supportNav: NavLinkItem[] = [
  { label: "Donate", href: "/support/donate", description: "Fund training and talent development" },
  {
    label: "Pledge equipment",
    href: "/support/equipment",
    description: "Offer clubs, bags and training aids",
  },
  { label: "Sponsor or partner", href: "/support/sponsor", description: "Work with the academy" },
];

export const bookTraining: NavLinkItem = { label: "Book Training", href: "/programs" };

export const footerNav = {
  explore: [
    { label: "About the academy", href: "/about" },
    { label: "Programs & training", href: "/programs" },
    { label: "Youth development", href: "/youth-development" },
    { label: "Impact", href: "/impact" },
    { label: "Events & outreach", href: "/events" },
    { label: "News", href: "/news" },
    { label: "Gallery", href: "/gallery" },
  ],
  support: [
    { label: "Donate", href: "/support/donate" },
    { label: "Pledge equipment", href: "/support/equipment" },
    { label: "Sponsor or partner", href: "/support/sponsor" },
    { label: "Sponsors & partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Safeguarding", href: "/legal/safeguarding" },
    { label: "Cookies", href: "/legal/cookies" },
    { label: "Donation terms", href: "/legal/donation-terms" },
  ],
} satisfies Record<string, NavLinkItem[]>;
