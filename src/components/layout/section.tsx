import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  ivory: "bg-ivory text-ink",
  sand: "bg-sand text-ink",
  white: "bg-white text-ink",
  /** Dark surface: focus rings and links switch to gold via data-surface. */
  dark: "bg-fairway text-ivory",
  night: "bg-night text-ivory",
} as const;

const spacing = {
  default: "py-16 md:py-28",
  compact: "py-10 md:py-16",
  none: "",
} as const;

export function Section({
  tone = "ivory",
  space = "default",
  className,
  ...props
}: React.ComponentProps<"section"> & { tone?: keyof typeof tones; space?: keyof typeof spacing }) {
  const dark = tone === "dark" || tone === "night";
  return (
    <section
      data-surface={dark ? "dark" : "light"}
      className={cn(tones[tone], spacing[space], className)}
      {...props}
    />
  );
}
