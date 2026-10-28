import Link from "@/components/app-link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { bookTraining, supportNav } from "@/lib/site";
import { DesktopNav } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";
import { NavDropdown } from "./nav-dropdown";

export function SiteHeader() {
  return (
    <header className="border-line bg-ivory/95 supports-[backdrop-filter]:bg-ivory/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 xl:h-20">
        <Link href="/" aria-label="Mwenge Golf Academy, home" className="shrink-0">
          <Logo />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-3">
          <div className="hidden xl:block">
            <NavDropdown label="Support Us" items={supportNav} appearance="button" align="right" />
          </div>
          <Button asChild className="hidden sm:inline-flex">
            <Link href={bookTraining.href}>{bookTraining.label}</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
