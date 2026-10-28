import * as React from "react";
import { cn } from "@/lib/utils";

const widths = {
  /** Standard content width (PRD 6.4). */
  default: "max-w-[1200px]",
  /** Wide editorial sections. */
  wide: "max-w-[1440px]",
  /** Text columns. */
  narrow: "max-w-[720px]",
} as const;

export function Container({
  width = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { width?: keyof typeof widths }) {
  return <div className={cn("mx-auto w-full px-5 sm:px-8", widths[width], className)} {...props} />;
}
