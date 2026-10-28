import { cn } from "@/lib/utils";

/**
 * Placeholder wordmark and mark. Replace with the client's supplied logo (SVG)
 * when available; keep the same props so the header and footer need no changes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-9", className)}>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 24.5V7.5l9.5 3.75L13 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="24.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        tone === "dark" ? "text-ivory" : "text-fairway",
        className,
      )}
    >
      <LogoMark className={tone === "dark" ? "text-gold" : "text-fairway"} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.375rem] font-semibold tracking-tight">Mwenge</span>
        <span className="mt-1 text-[0.8125rem] font-medium tracking-wide opacity-80">
          Golf Academy
        </span>
      </span>
    </span>
  );
}
