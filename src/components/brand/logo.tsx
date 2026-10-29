import { cn } from "@/lib/utils";

/**
 * Official Mwenge Golf Academy logo (supplied by the client).
 *
 * `public/brand/mwenge-logo-source.png` is the client's original file, unaltered. It has a
 * transparent margin, so it is cropped to the artwork with CSS (box measured on the 1536x1024
 * source: x 136, y 49, 1268x903) instead of editing the image. The artwork is dark green and
 * gold and only designed for light backgrounds; on dark surfaces it sits on an ivory plate and
 * is never recoloured. Replace with the client's vector (SVG) when supplied.
 */
const SOURCE = { src: "/brand/mwenge-logo-source.png", width: 1536, height: 1024 } as const;
const BOX = { x: 136, y: 49, width: 1268, height: 903 } as const;

export function Logo({
  surface = "light",
  priority = false,
  className,
}: {
  /** "dark" places the artwork on an ivory plate so it stays legible. */
  surface?: "light" | "dark";
  priority?: boolean;
  /** Controls the rendered size, e.g. `h-14`. Width follows the artwork's aspect ratio. */
  className?: string;
}) {
  const artwork = (
    <span
      className="relative block h-full overflow-hidden"
      style={{ aspectRatio: `${BOX.width} / ${BOX.height}` }}
    >
      <img
        src={SOURCE.src}
        width={SOURCE.width}
        height={SOURCE.height}
        alt="Mwenge Golf Academy"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="absolute max-w-none"
        style={{
          height: "auto",
          width: `${(SOURCE.width / BOX.width) * 100}%`,
          left: `${(-BOX.x / BOX.width) * 100}%`,
          top: `${(-BOX.y / BOX.height) * 100}%`,
        }}
      />
    </span>
  );

  if (surface === "dark") {
    return <span className={cn("bg-ivory inline-flex rounded-md p-3", className)}>{artwork}</span>;
  }
  return <span className={cn("inline-flex", className)}>{artwork}</span>;
}
