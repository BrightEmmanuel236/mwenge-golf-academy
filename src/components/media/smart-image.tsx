import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaSource } from "@/lib/content/media";

/**
 * Image roles from PRD 7.2. Each role fixes the aspect ratio per breakpoint and the
 * `sizes` hint so mobile never downloads desktop-width files.
 */
const roles = {
  hero: {
    ratio: "aspect-[4/5] md:aspect-[16/9]",
    sizes: "100vw",
  },
  banner: {
    ratio: "aspect-[16/10] md:aspect-[21/9]",
    sizes: "100vw",
  },
  feature: {
    ratio: "aspect-[3/2] md:aspect-[4/5]",
    sizes: "(min-width: 1024px) 40vw, 100vw",
  },
  card: {
    ratio: "aspect-[3/2]",
    sizes: "(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw",
  },
  portrait: {
    ratio: "aspect-[4/5]",
    sizes: "(min-width: 1024px) 288px, (min-width: 640px) 33vw, 50vw",
  },
  square: {
    ratio: "aspect-square",
    sizes: "(min-width: 1024px) 288px, 50vw",
  },
  gallery: {
    ratio: "aspect-square md:aspect-[4/3]",
    sizes: "(min-width: 1024px) 384px, 50vw",
  },
  video: {
    ratio: "aspect-video",
    sizes: "(min-width: 1024px) 800px, 100vw",
  },
} as const;

export type ImageRole = keyof typeof roles;

type AltProps = { alt: string; decorative?: false } | { decorative: true; alt?: never };

type SmartImageProps = AltProps & {
  src: string | null;
  role: ImageRole;
  source: MediaSource;
  /** Focal point percentages; keeps faces and key subjects in frame at every crop. */
  focal?: { x: number; y: number };
  /** Hero images: preload and load eagerly. All other images lazy-load. */
  priority?: boolean;
  /** Overrides the default `sizes` for the role. */
  sizes?: string;
  /** Dark gradient so text placed over the image stays legible. */
  overlay?: "none" | "bottom" | "full";
  blurDataURL?: string;
  className?: string;
  /** Message shown when `src` is null. */
  emptyLabel?: string;
};

const overlays = {
  none: "",
  bottom:
    "after:absolute after:inset-0 after:bg-gradient-to-t after:from-night/65 after:via-night/20 after:to-transparent",
  full: "after:absolute after:inset-0 after:bg-night/55",
} as const;

/**
 * The only way images are rendered on the site. It enforces alt text (or an explicit
 * `decorative` flag), reserves space to prevent layout shift, applies a focal point,
 * and labels imagery that is not authentic academy photography.
 */
export function SmartImage(props: SmartImageProps) {
  const {
    src,
    role,
    source,
    focal = { x: 50, y: 50 },
    priority = false,
    overlay = "none",
    blurDataURL,
    className,
    emptyLabel = "Photography to be added",
  } = props;
  const config = roles[role];
  const alt = props.decorative ? "" : props.alt;
  const isSvg = src?.endsWith(".svg") ?? false;

  return (
    <div
      className={cn(
        "bg-sand relative isolate w-full overflow-hidden",
        config.ratio,
        overlays[overlay],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={props.sizes ?? config.sizes}
          priority={priority}
          quality={80}
          unoptimized={isSvg}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          className="object-cover"
          style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
        />
      ) : (
        <div className="text-slate absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
          {emptyLabel}
        </div>
      )}
      {source === "licensed" ? (
        <span className="bg-night/80 text-ivory absolute bottom-2 left-2 z-10 rounded-sm px-2 py-1 text-xs font-medium">
          Illustrative image
        </span>
      ) : null}
      {source === "placeholder" ? (
        <span className="bg-earth absolute top-2 left-2 z-10 rounded-sm px-2 py-1 text-xs font-medium text-white">
          Placeholder image
        </span>
      ) : null}
    </div>
  );
}
