#!/usr/bin/env node
// Turns original photographs into responsive AVIF, WebP and JPEG files and a manifest.
//
//   bun add -d sharp                       (one-off; needs your approval to add a dependency)
//   put originals in  photos-src/
//   node scripts/optimize-images.mjs
//
// Output: public/photos/<name>-<width>.{avif,webp,jpg}  and  src/lib/content/photo-variants.generated.json
// Camera metadata, including GPS location, is removed from every output (PRD 7.7).
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "photos-src";
const OUT_DIR = "public/photos";
const MANIFEST = "src/lib/content/photo-variants.generated.json";
const WIDTHS = [480, 768, 1280, 1920];
const INPUT = /\.(jpe?g|png|webp|tiff?)$/i;

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

await mkdir(OUT_DIR, { recursive: true });
const files = (await readdir(SRC_DIR).catch(() => [])).filter((file) => INPUT.test(file));
if (files.length === 0) {
  console.log(`No images found in ${SRC_DIR}/. Add originals there and run again.`);
  process.exit(0);
}

const manifest = {};
for (const file of files) {
  const name = slugify(file);
  // rotate() applies the camera's orientation before the metadata is dropped.
  const base = () => sharp(path.join(SRC_DIR, file)).rotate();
  const { width: fullWidth, height: fullHeight } = await base().metadata();
  const oriented = await base().toBuffer({ resolveWithObject: true });
  const sourceWidth = oriented.info.width ?? fullWidth ?? 0;
  const sourceHeight = oriented.info.height ?? fullHeight ?? 0;
  const widths = WIDTHS.filter((w) => w <= sourceWidth);
  if (widths.length === 0) widths.push(sourceWidth);

  const variants = [];
  for (const width of widths) {
    const resized = () => sharp(oriented.data).resize({ width, withoutEnlargement: true });
    // sharp writes no metadata unless asked, so EXIF/GPS never reaches the outputs.
    await resized().avif({ quality: 55, effort: 6 }).toFile(`${OUT_DIR}/${name}-${width}.avif`);
    await resized().webp({ quality: 78, effort: 6 }).toFile(`${OUT_DIR}/${name}-${width}.webp`);
    await resized()
      .jpeg({ quality: 80, mozjpeg: true, progressive: true })
      .toFile(`${OUT_DIR}/${name}-${width}.jpg`);
    variants.push({
      width,
      avif: `/photos/${name}-${width}.avif`,
      webp: `/photos/${name}-${width}.webp`,
      fallback: `/photos/${name}-${width}.jpg`,
    });
  }
  manifest[name] = { width: sourceWidth, height: sourceHeight, variants };
  console.log(`${file} -> ${variants.length} sizes (${widths.join(", ")}px)`);
}
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${MANIFEST}`);
