import { getAllNews, getEvents, getPrograms, getPublicTalents } from "@/lib/content";

export interface SitemapEntry {
  path: string;
  /** ISO date (YYYY-MM-DD) the page last changed, when known. */
  lastmod?: string;
}

/**
 * Pages worth indexing. Deliberately excluded: /style-guide, the donation thank-you page and the
 * legal pages while they hold only an outline (all `noindex`), and anything behind /admin.
 */
const staticPaths = [
  "/",
  "/about",
  "/programs",
  "/youth-development",
  "/impact",
  "/events",
  "/news",
  "/gallery",
  "/partners",
  "/contact",
  "/support",
  "/support/donate",
  "/support/equipment",
  "/support/sponsor",
] as const;

const day = (iso: string) => iso.slice(0, 10);

export async function getSitemapEntries(now: Date = new Date()): Promise<SitemapEntry[]> {
  const [programs, events, news, talents] = await Promise.all([
    getPrograms(),
    getEvents(now),
    getAllNews(now),
    getPublicTalents(now),
  ]);
  return [
    ...staticPaths.map((path) => ({ path })),
    ...programs.map((program) => ({ path: `/programs/${program.slug}` })),
    ...[...events.upcoming, ...events.past].map((event) => ({
      path: `/events/${event.slug}`,
      lastmod: day(event.startsAt),
    })),
    ...news.map((post) => ({ path: `/news/${post.slug}`, lastmod: day(post.publishedAt) })),
    // Individual pages of young people are listed only when the guardian consented to indexing.
    ...talents
      .filter((talent) => talent.indexable)
      .map((talent) => ({ path: `/impact/talents/${talent.slug}` })),
  ];
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function renderSitemap(entries: SitemapEntry[], baseUrl: string): string {
  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(`${baseUrl}${entry.path}`)}</loc>${
          entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
        }\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
