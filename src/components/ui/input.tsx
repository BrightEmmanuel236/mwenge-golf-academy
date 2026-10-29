import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldControlClass =
  "w-full rounded-md border border-field bg-white px-4 text-base text-ink placeholder:text-slate/70 transition-colors duration-200 hover:border-fairway focus-visible:border-fairway aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-sand disabled:opacity-70";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn(fieldControlClass, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldControlClass, "min-h-32 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(fieldControlClass, "h-12 appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="text-slate pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  );
}

export function Checkbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("mt-0.5 size-5 shrink-0 rounded-sm border border-field accent-fairway", className)}
      {...props}
    />
  );
}
