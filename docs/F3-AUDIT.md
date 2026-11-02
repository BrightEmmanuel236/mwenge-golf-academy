# F3 audit: performance, SEO, accessibility

Measured on a production build of the repo (commit `ed4ddbd`) against the F3 changes.
Lighthouse 13.6, mobile emulation, simulated slow 4G and 4x CPU slowdown, served through a gzip
layer so text assets were compressed as they would be on a real host. Local measurements only;
re-run on the deployed preview before treating them as final.

## Results

| Page | Performance | LCP | Page weight |
|---|---|---|---|
| `/` | 83 -> 91 | 3.2 s -> 2.8 s | 1,754 -> 316 KiB |
| `/about` | 70 -> 89 | 10.4 s -> 3.1 s | 1,744 -> 306 KiB |
| `/support/donate` | 90 -> 92 | 2.9 s -> 2.5 s | 1,746 -> 308 KiB |

Accessibility, best-practices and SEO scored 100 before and after. CLS was 0 throughout.

## What changed

- **Logo**: the 1.45 MB original loaded on every page. It is now served as AVIF/WebP (PNG fallback)
  in four widths; the header logo is about 12 KB. The original stays in `public/brand/` and is no
  longer loaded by any page.
- **Fonts**: the two Latin font files every page uses are preloaded.
- **Empty states**: with sample content hidden (production), the home page showed a heading with
  nothing under it and `/programs` was blank. Both now show Juniors / Adults / Corporate pathways
  that lead to the contact form, until real programs are published.
- **SEO**: `/sitemap.xml` (built from the same data as the pages, so hidden samples and
  `noindex` pages are excluded), organization data on the home page, breadcrumb data on inner
  pages, event and article data on detail pages, and a default share image.
- **Images**: `SmartImage` renders AVIF/WebP `<picture>` sources when an image has `variants`
  (see `IMAGES.md`).

## Still open

- **LCP is still slightly above the 2.5 s target** on `/` and `/about` in this simulation. What
  remains is render-blocking CSS (about 40 KB) and CPU cost under 4x throttling. A change to
  `/about`'s lazy-loaded first image was tried and made no measurable difference, so it was not
  kept. Re-measure on the deployed host (CDN, brotli, HTTP/2) before doing more.
- **Cache headers**: static files are served with no cache lifetime in the local server.
  Hashed files under `/assets/` can be cached for a year; `/brand`, `/photos` and `/placeholders`
  for about a month. How to set this depends on the host (Cloudflare `_headers`, `vercel.json`);
  the host is not settled, so nothing was added.
- **Sitemap in robots.txt**: add `Sitemap: https://<final-domain>/sitemap.xml` once the domain is
  fixed, and set `VITE_SITE_URL` to that domain so canonical links and structured data use it.
- **Lint**: the repository already had 135 prettier errors before F3 (files edited by Lovable).
  The files F3 changed are clean. Running `eslint --fix` once repo-wide would clear the rest.

## Accessibility checks run (production build)

- axe-core (WCAG 2.0/2.1/2.2 A and AA plus best practices), 16 pages at 390 px and 1280 px:
  no violations after one fix to the new empty-state heading level.
- No horizontal scrolling at 320, 768, 1024 and 1280 px on any page.
- Keyboard: tabbing through Home, Contact, Donate and Gallery reached every control with a visible
  focus indicator and no traps.
- Reduced motion: no transitions or animations remain when the system setting is on.

Not covered by these automated checks: screen-reader testing with real assistive technology,
and review of the real photography and copy.
