import * as React from "react";
import Link from "@/components/app-link";
import { usePathname } from "@/hooks/use-pathname";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { bookTraining, isGroup, primaryNav, supportNav } from "@/lib/site";

export function MobileMenu() {
  // Open state is tied to the pathname it was opened on, so navigating closes the menu.
  const [openOn, setOpenOn] = React.useState<string | null>(null);
  const pathname = usePathname();

  return (
    <Dialog.Root
      open={openOn === pathname}
      onOpenChange={(next) => setOpenOn(next ? pathname : null)}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="text-fairway inline-flex h-11 items-center gap-2 rounded-md px-3 font-medium xl:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
          Menu
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-night text-ivory fixed inset-0 z-50 flex flex-col overflow-y-auto"
        >
          <Dialog.Title className="sr-only">Site menu</Dialog.Title>
          {/* Top bar matches the site header so the official logo sits on its intended light background. */}
          <div className="bg-ivory text-fairway flex h-[76px] shrink-0 items-center justify-between px-5 sm:px-8">
            <Link href="/" aria-label="Mwenge Golf Academy, home">
              <Logo className="h-[60px]" />
            </Link>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-md px-3 font-medium"
              >
                <X className="size-5" aria-hidden="true" />
                Close
              </button>
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile" data-surface="dark" className="flex-1 px-5 pt-4 pb-8 sm:px-8">
            <ul className="divide-ivory/15 flex flex-col divide-y">
              {primaryNav.map((item) =>
                isGroup(item) ? (
                  <li key={item.label} className="py-4">
                    <p className="text-gold text-sm">{item.label}</p>
                    <ul className="mt-2 flex flex-col">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="font-display block py-2 text-2xl font-semibold"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="font-display aria-[current=page]:text-gold block py-4 text-2xl font-semibold"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href={bookTraining.href}>{bookTraining.label}</Link>
              </Button>
              <p className="text-gold mt-4 text-sm">Support the academy</p>
              <ul className="flex flex-col">
                {supportNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-2 text-lg">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
