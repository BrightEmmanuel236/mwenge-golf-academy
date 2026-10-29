import Link from "@/components/app-link";
import { usePathname } from "@/hooks/use-pathname";
import { cn } from "@/lib/utils";
import { isGroup, primaryNav } from "@/lib/site";
import { NavDropdown } from "./nav-dropdown";

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden xl:block">
      <ul className="flex items-center gap-7">
        {primaryNav.map((item) => (
          <li key={item.label}>
            {isGroup(item) ? (
              <NavDropdown label={item.label} items={item.children} />
            ) : (
              <Link
                href={item.href}
                aria-current={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "page"
                    : undefined
                }
                className={cn(
                  "text-ink hover:text-canopy inline-flex h-11 items-center border-b-2 border-transparent text-[0.9375rem] font-medium transition-colors",
                  (pathname === item.href || pathname.startsWith(`${item.href}/`)) && "border-gold",
                )}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
