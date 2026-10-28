import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Main call to action. Gold fill carries Fairway Green text (PRD 6.2). */
        primary: "bg-gold text-fairway hover:bg-gold-bright active:bg-gold-deep",
        /** Secondary call to action on light surfaces. */
        secondary: "border border-fairway text-fairway hover:bg-fairway hover:text-ivory",
        /** Solid dark button on light surfaces. */
        dark: "bg-fairway text-ivory hover:bg-night",
        /** Secondary call to action on dark surfaces. */
        "secondary-on-dark": "border border-ivory/70 text-ivory hover:bg-ivory hover:text-fairway",
        /** Inline text action. */
        link: "text-canopy underline underline-offset-4 hover:text-fairway",
      },
      size: {
        default: "h-12 px-6 text-[0.9375rem]",
        sm: "h-11 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        none: "",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
