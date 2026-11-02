import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Components under test use router-aware links and hooks; plain stand-ins keep these unit tests
// independent of the router (routing itself is covered by routes.test.tsx and routes-f2.test.tsx).
vi.mock("@/components/app-link", () => ({
  default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/hooks/use-pathname", () => ({ usePathname: () => "/about" }));

import { PageHeader } from "@/components/layout/page-header";
import { Logo } from "@/components/brand/logo";
import { SmartImage } from "@/components/media/smart-image";
import { AudiencePathways } from "@/components/site/audience-pathways";
import { variantSrcSet, type ImageVariant } from "@/lib/content/media";
import { pageHead } from "@/lib/seo";
import { getSitemapEntries, renderSitemap } from "@/lib/sitemap";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  eventJsonLd,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/structured-data";
import type { AcademyEvent, NewsPost } from "@/lib/content/types";

afterEach(cleanup);

describe("Logo", () => {
  it("serves AVIF and WebP with a PNG fallback and four widths", () => {
    const { container } = render(<Logo />);
    const sources = [...container.querySelectorAll("source")];
    expect(sources.map((s) => s.getAttribute("type"))).toEqual(["image/avif", "image/webp"]);
    expect(sources[0]?.getAttribute("srcset")).toContain("/brand/mwenge-logo-128.avif 128w");
    expect(sources[0]?.getAttribute("srcset")).toContain("/brand/mwenge-logo-640.avif 640w");
    const img = screen.getByAltText("Mwenge Golf Academy");
    expect(img.getAttribute("src")).toBe("/brand/mwenge-logo-384.png");
    expect(img.getAttribute("width")).toBe("640");
    expect(img.getAttribute("height")).toBe("456");
  });

  it("never points at the 1.4 MB original", () => {
    const { container } = render(<Logo priority />);
    expect(container.innerHTML).not.toContain("mwenge-logo-source");
  });

  it("loads eagerly only when priority is set, and lazily otherwise", () => {
    const { unmount } = render(<Logo priority />);
    expect(screen.getByAltText("Mwenge Golf Academy").getAttribute("loading")).toBe("eager");
    unmount();
    render(<Logo />);
    expect(screen.getByAltText("Mwenge Golf Academy").getAttribute("loading")).toBe("lazy");
  });

  it("puts the artwork on an ivory plate on dark surfaces without altering it", () => {
    const { container } = render(<Logo surface="dark" />);
    expect(container.firstElementChild?.className).toContain("bg-ivory");
  });
});

describe("responsive image variants", () => {
  const variants: ImageVariant[] = [
    { width: 1280, avif: "/p/a-1280.avif", webp: "/p/a-1280.webp", fallback: "/p/a-1280.jpg" },
    { width: 480, avif: "/p/a-480.avif", webp: "/p/a-480.webp", fallback: "/p/a-480.jpg" },
  ];

  it("builds srcset strings per format, smallest first", () => {
    expect(variantSrcSet(variants, "avif")).toBe("/p/a-480.avif 480w, /p/a-1280.avif 1280w");
    expect(variantSrcSet(variants, "fallback")).toBe("/p/a-480.jpg 480w, /p/a-1280.jpg 1280w");
  });

  it("returns undefined for a format no variant provides", () => {
    expect(variantSrcSet([{ width: 480, fallback: "/p/a.jpg" }], "avif")).toBeUndefined();
  });

  it("renders AVIF and WebP sources when variants exist", () => {
    const { container } = render(
      <SmartImage
        role="card"
        src="/p/a-480.jpg"
        source="academy"
        alt="Players on the green"
        variants={variants}
      />,
    );
    expect([...container.querySelectorAll("source")].map((s) => s.getAttribute("type"))).toEqual([
      "image/avif",
      "image/webp",
    ]);
    expect(screen.getByAltText("Players on the green").getAttribute("srcset")).toContain("480w");
  });

  it("renders a plain image (no sources) for single-file images such as SVG placeholders", () => {
    const { container } = render(
      <SmartImage
        role="card"
        src="/placeholders/fairway-dawn.svg"
        source="placeholder"
        alt="Placeholder"
      />,
    );
    expect(container.querySelectorAll("source")).toHaveLength(0);
    expect(screen.getByAltText("Placeholder").getAttribute("srcset")).toBeNull();
  });
});

describe("structured data", () => {
  it("escapes < so content can never close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c");
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)</script>");
  });

  it("describes the academy without inventing contact details or social profiles", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("SportsOrganization");
    expect(org["sport"]).toBe("Golf");
    expect(org).not.toHaveProperty("contactPoint");
    expect(org).not.toHaveProperty("sameAs");
  });

  it("builds breadcrumbs with absolute URLs and the current page last", () => {
    const data = breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "About" }], "/about");
    const items = data["itemListElement"] as { position: number; name: string; item: string }[];
    expect(items.map((i) => i.position)).toEqual([1, 2]);
    expect(items[1]?.name).toBe("About");
    expect(items[1]?.item.endsWith("/about")).toBe(true);
    expect(items[0]?.item.startsWith("http")).toBe(true);
  });

  const event: AcademyEvent = {
    slug: "day",
    title: "Day",
    type: "outreach",
    startsAt: "2027-02-14T08:00:00+03:00",
    endsAt: "2027-02-14T13:00:00+03:00",
    venue: "A venue",
    summary: "Summary",
    image: { src: "/photos/day.jpg", alt: "x", source: "academy" },
    status: "published",
  };

  it("includes an event photo only when it is authentic academy photography", () => {
    expect(eventJsonLd(event)["image"]).toMatch(/\/photos\/day\.jpg$/);
    const stock = { ...event, image: { ...event.image, source: "licensed" as const } };
    const placeholder = { ...event, image: { ...event.image, source: "placeholder" as const } };
    expect(eventJsonLd(stock)).not.toHaveProperty("image");
    expect(eventJsonLd(placeholder)).not.toHaveProperty("image");
  });

  it("marks articles with the academy as author and publisher", () => {
    const post: NewsPost = {
      slug: "p",
      title: "T",
      excerpt: "E",
      category: "News",
      publishedAt: "2026-10-01T09:00:00+03:00",
      image: { src: null, alt: "x", source: "academy" },
      status: "published",
    };
    const article = articleJsonLd(post);
    expect(article["@type"]).toBe("Article");
    expect(article).toHaveProperty("publisher");
    expect(article).not.toHaveProperty("image");
  });

  it("adds a share image and optional JSON-LD to page head tags", () => {
    const plain = pageHead({ title: "T", description: "D", path: "/x" });
    const metas = plain.meta as { property?: string; name?: string; content?: string }[];
    expect(metas.find((m) => m.property === "og:image")?.content).toMatch(/\/og-default\.jpg$/);
    expect(metas.find((m) => m.name === "twitter:image")).toBeTruthy();
    expect(plain).not.toHaveProperty("scripts");
    const withLd = pageHead({
      title: "T",
      description: "D",
      path: "/x",
      jsonLd: [{ "@type": "Thing" }],
    });
    expect(withLd.scripts?.[0]?.type).toBe("application/ld+json");
  });

  it("PageHeader embeds a BreadcrumbList for the current page", () => {
    const { container } = render(
      <PageHeader title="About" breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script?.textContent ?? "{}")["@type"]).toBe("BreadcrumbList");
  });
});

describe("sitemap", () => {
  it("escapes XML special characters in URLs", () => {
    const xml = renderSitemap([{ path: "/a?x=1&y=2" }], "https://example.org");
    expect(xml).toContain("<loc>https://example.org/a?x=1&amp;y=2</loc>");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it("lists indexable pages and leaves out noindex pages", async () => {
    const paths = (await getSitemapEntries()).map((e) => e.path);
    for (const path of [
      "/",
      "/about",
      "/programs",
      "/contact",
      "/support/donate",
      "/events",
      "/news",
    ]) {
      expect(paths, path).toContain(path);
    }
    for (const hidden of [
      "/style-guide",
      "/support/donate/thank-you",
      "/legal/privacy",
      "/admin",
    ]) {
      expect(paths, hidden).not.toContain(hidden);
    }
  });

  it("lists no individual talent pages while no consented, indexable profile exists", async () => {
    const paths = (await getSitemapEntries()).map((e) => e.path);
    expect(paths.some((p) => p.startsWith("/impact/talents/"))).toBe(false);
  });

  it("gives dated entries a lastmod in YYYY-MM-DD form", async () => {
    const dated = (await getSitemapEntries()).filter((e) => e.lastmod);
    for (const entry of dated) expect(entry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("empty-state pathways", () => {
  it("shows the three audiences with a way to enquire", () => {
    render(<AudiencePathways intro="Program details will be published here." />);
    expect(screen.getByText("Program details will be published here.")).toBeTruthy();
    for (const name of ["Juniors", "Adults", "Corporate clients"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) expect(link.getAttribute("href")).toBe("/contact");
  });

  it("uses the heading level it is given so the page outline has no skipped levels", () => {
    const { container, rerender } = render(<AudiencePathways />);
    expect(container.querySelectorAll("h3")).toHaveLength(3);
    rerender(<AudiencePathways headingLevel="h2" />);
    expect(container.querySelectorAll("h2")).toHaveLength(3);
    expect(container.querySelectorAll("h3")).toHaveLength(0);
  });
});
