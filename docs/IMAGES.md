# Adding real photographs

Placeholders are single SVG files. Real photographs should go through the optimizer so visitors
get small AVIF/WebP files in the right size, and so camera location data never reaches the site.

1. One-off, with approval to add a dev dependency: `bun add -d sharp`
2. Put originals in `photos-src/` (do not commit them; they can be large and carry GPS data).
3. Run `node scripts/optimize-images.mjs`.
   - Writes AVIF, WebP and JPEG at 480, 768, 1280 and 1920 px (never enlarged) to `public/photos/`.
   - Removes all camera metadata, including GPS location (PRD 7.7). Orientation is applied first.
   - Writes `src/lib/content/photo-variants.generated.json`.
4. In content data, use the generated entry as the image's `variants`, with the JPEG as `src`:

   ```ts
   import photos from "./photo-variants.generated.json";
   const p = photos["practice-day-1"];
   image: {
     src: p.variants[0].fallback, alt: "…", source: "academy",
     width: p.width, height: p.height, variants: p.variants,
   }
   ```

Every card, hero and detail banner already passes `variants` through to `SmartImage`.
Use `source: "academy"` only for the academy's own photographs: structured data offers only those
to search engines. Each photograph still needs its usage-rights and consent record (PRD 14.5).
