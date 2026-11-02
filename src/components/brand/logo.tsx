import { cn } from "@/lib/utils";

/**
 * Official Mwenge Golf Academy logo (supplied by the client).
 *
 * Served as AVIF and WebP with a PNG fallback, in four widths, cut from the client's original
 * file with its transparent margin trimmed (originals: public/brand/mwenge-logo-source.png, not
 * loaded by the site). The artwork is never recoloured. It is dark green and gold and only
 * designed for light backgrounds, so on dark surfaces it sits on an ivory plate.
 * Replace with the client's vector (SVG) when supplied.
 */
const WIDTHS = [128, 256, 384, 640] as const;
/** Intrinsic size of the 640px file; every variant shares this aspect ratio. */
const INTRINSIC = { width: 640, height: 456 } as const;

const srcSet = (format: "avif" | "webp" | "png") =>
  WIDTHS.map((width) => `/brand/mwenge-logo-${width}.${format} ${width}w`).join(", ");

export function Logo({
  surface = "light",
  priority = false,
  sizes = "124px",
  className,
}: {
  /** "dark" places the artwork on an ivory plate so it stays legible. */
  surface?: "light" | "dark";
  /** Load immediately (header logo, above the fold). */
  priority?: boolean;
  /** Rendered width, so the browser picks the smallest file that is still sharp. */
  sizes?: string;
  /** Controls the rendered size, e.g. `h-14`. Width follows the artwork's aspect ratio. */
  className?: string;
}) {
  const artwork = (
    <picture className="block h-full">
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src="/brand/mwenge-logo-384.png"
        srcSet={srcSet("png")}
        sizes={sizes}
        width={INTRINSIC.width}
        height={INTRINSIC.height}
        alt="Mwenge Golf Academy"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="h-full w-auto"
      />
    </picture>
  );

  if (surface === "dark") {
    return <span className={cn("bg-ivory inline-flex rounded-md p-3", className)}>{artwork}</span>;
  }
  return <span className={cn("inline-flex", className)}>{artwork}</span>;
}
