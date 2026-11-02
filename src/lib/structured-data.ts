import type { AcademyEvent, NewsPost } from "@/lib/content/types";
import { site } from "@/lib/site";

type JsonLd = Record<string, unknown>;

export const absoluteUrl = (path: string) => `${site.url}${path}`;

/**
 * JSON-LD is embedded in a <script> tag, so `<` is escaped to stop content such as "</script>"
 * ending the tag early.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const publisher = (): JsonLd => ({
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: absoluteUrl("/brand/mwenge-logo-640.png"),
});

/** The academy as a sports organization. Optional details appear only once the client supplies them. */
export function organizationJsonLd(): JsonLd {
  const sameAs = Object.values(site.social).filter((value): value is string => Boolean(value));
  const { email, phone } = site.contact;
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/brand/mwenge-logo-640.png"),
    description: site.tagline,
    sport: "Golf",
    areaServed: { "@type": "Country", name: "Uganda" },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(email || phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
          },
        }
      : {}),
  };
}

/** Breadcrumb trail. The last item has no link on the page, so it points at the current URL. */
export function breadcrumbJsonLd(
  items: { label: string; href?: string | undefined }[],
  currentPath: string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? currentPath),
    })),
  };
}

/** Only authentic academy photographs are offered to search engines as the event's image. */
const imageFor = (media: { src: string | null; source: string }): { image?: string } =>
  media.source === "academy" && media.src ? { image: absoluteUrl(media.src) } : {};

export function eventJsonLd(event: AcademyEvent): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue },
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    url: absoluteUrl(`/events/${event.slug}`),
    ...imageFor(event.image),
  };
}

export function articleJsonLd(post: NewsPost): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    mainEntityOfPage: absoluteUrl(`/news/${post.slug}`),
    author: { "@type": "Organization", name: site.name },
    publisher: publisher(),
    ...imageFor(post.image),
  };
}
