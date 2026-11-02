import { site } from "@/lib/site";
import { absoluteUrl, serializeJsonLd } from "@/lib/structured-data";

/** Per-page head tags (title, description, canonical, Open Graph) for TanStack route `head()`. */
export function pageHead({
  title,
  description,
  path,
  absoluteTitle = false,
  noindex = false,
  jsonLd = [],
}: {
  title: string;
  description: string;
  path: string;
  /** Use the title as given instead of appending the site name. */
  absoluteTitle?: boolean;
  /** Keep a page out of search results (for example, pages awaiting approved content). */
  noindex?: boolean;
  /** Structured data (schema.org) to embed in the page head. */
  jsonLd?: Record<string, unknown>[];
}) {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  const url = `${site.url}${path}`;
  const image = absoluteUrl("/og-default.jpg");
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${site.name} logo` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    ...(jsonLd.length > 0
      ? {
          scripts: jsonLd.map((data) => ({
            type: "application/ld+json",
            children: serializeJsonLd(data),
          })),
        }
      : {}),
  };
}
