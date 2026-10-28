import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-sand text-fairway",
        outline: "border border-line text-slate",
        /** Used sparingly to mark youth and impact content (PRD 6.2). */
        earth: "bg-earth text-white",
        dark: "bg-fairway text-ivory",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
