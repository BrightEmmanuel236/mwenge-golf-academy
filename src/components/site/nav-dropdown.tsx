
import * as React from "react";
import Link from "@/components/app-link";
import { usePathname } from "@/hooks/use-pathname";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { NavLinkItem } from "@/lib/site";

/**
 * Disclosure-style dropdown for site navigation (button + list of links), which is the
 * recommended accessible pattern for navigation, as opposed to an ARIA menu.
 * Closes on Escape, outside click, focus leaving the control, and route change.
 */
export function NavDropdown({
  label,
  items,
  appearance = "link",
  align = "left",
}: {
  label: string;
  items: NavLinkItem[];
  appearance?: "link" | "button";
  align?: "left" | "right";
}) {
  // Open state is tied to the pathname it was opened on, so navigating closes the menu
  // without needing an effect.
  const [openOn, setOpenOn] = React.useState<string | null>(null);
  const pathname = usePathname();
  const open = openOn === pathname;
  const setOpen = React.useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setOpenOn((current) => {
        const value = typeof next === "function" ? next(current === pathname) : next;
        return value ? pathname : null;
      });
    },
    [pathname],
  );
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const isActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          appearance === "button"
            ? buttonVariants({ variant: "secondary", size: "default" })
            : "text-ink hover:text-canopy inline-flex h-11 items-center gap-1 text-[0.9375rem] font-medium transition-colors",
          appearance === "link" && isActive && "text-canopy",
        )}
      >
        {label}
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "border-line shadow-raised absolute top-full z-50 mt-2 w-72 rounded-md border bg-white p-2",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="hover:bg-sand block rounded-md px-3 py-3 transition-colors"
              >
                <span className="text-fairway block text-[0.9375rem] font-medium">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="text-slate mt-0.5 block text-sm">{item.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
