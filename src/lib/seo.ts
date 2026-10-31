import { site } from "@/lib/site";

/** Per-page head tags (title, description, canonical, Open Graph) for TanStack route `head()`. */
export function pageHead({
  title,
  description,
  path,
  absoluteTitle = false,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Use the title as given instead of appending the site name. */
  absoluteTitle?: boolean;
  /** Keep a page out of search results (for example, pages awaiting approved content). */
  noindex?: boolean;
}) {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  const url = `${site.url}${path}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
