import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section heading with the signature 2px gold rule (PRD 6.4).
 * The optional eyebrow is only for text that adds information (for example a category).
 */
export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Tag = "h2",
  align = "left",
  onDark = false,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="bg-gold h-0.5 w-12" />
      {eyebrow ? (
        <p className={cn("text-sm font-medium", onDark ? "text-gold" : "text-gold-ink")}>
          {eyebrow}
        </p>
      ) : null}
      <Tag className="max-w-[24ch] md:max-w-[28ch]">{title}</Tag>
      {description ? (
        <p className={cn("measure text-lg", onDark ? "text-ivory/85" : "text-slate")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
