import { createFileRoute } from "@tanstack/react-router";
import { getSitemapEntries, renderSitemap } from "@/lib/sitemap";
import { site } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(renderSitemap(await getSitemapEntries(), site.url), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
