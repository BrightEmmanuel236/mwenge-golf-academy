/** Where an image came from. Drives labelling and where it may be used (PRD 7.6). */
export type MediaSource = "academy" | "licensed" | "placeholder";

/** One width of an optimized image, in each format that was generated. */
export interface ImageVariant {
  width: number;
  avif?: string;
  webp?: string;
  /** JPEG or PNG fallback for browsers without AVIF/WebP. */
  fallback: string;
}

/** `srcset` value for one format, or undefined when no variant has that format. */
export function variantSrcSet(
  variants: ImageVariant[],
  format: "avif" | "webp" | "fallback",
): string | undefined {
  const entries = [...variants]
    .sort((a, b) => a.width - b.width)
    .flatMap((variant) => {
      const url = variant[format];
      return url ? [`${url} ${variant.width}w`] : [];
    });
  return entries.length > 0 ? entries.join(", ") : undefined;
}

export interface MediaRef {
  /** Path under /public or an absolute URL. `null` renders an "awaiting photography" state. */
  src: string | null;
  alt: string;
  source: MediaSource;
  /** Required for licensed imagery. */
  credit?: string;
  licenseRef?: string;
  /** Focal point as percentages (0-100) so crops adapt to each aspect ratio. */
  focal?: { x: number; y: number } | undefined;
  width?: number;
  height?: number;
  blurDataURL?: string;
  /**
   * Pre-generated responsive files (see docs/IMAGES.md). When present, images render as
   * <picture> with AVIF and WebP sources; `src` stays as the fallback.
   */
  variants?: ImageVariant[] | undefined;
  /** True when a minor is identifiable. Requires consent before publication. */
  containsMinors?: boolean;
  caption?: string;
}

/**
 * Impact, Events and Gallery may only show authentic academy photography.
 * Licensed or placeholder images must never imply a real academy activity.
 */
export function isAuthenticAcademyMedia(media: MediaRef): boolean {
  return media.source === "academy";
}

/** Licensed imagery needs a credit and licence reference to be usable at all. */
export function hasValidLicence(media: MediaRef): boolean {
  if (media.source !== "licensed") return true;
  return Boolean(media.credit?.trim()) && Boolean(media.licenseRef?.trim());
}
