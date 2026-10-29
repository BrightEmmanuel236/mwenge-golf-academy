import Link from "@/components/app-link";
import { Button } from "@/components/ui/button";

/** Mobile-only persistent call to action for program and youth pages (PRD 3.2). */
export function StickyBookBar({
  href = "#enquire",
  label = "Send an enquiry",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="border-line bg-ivory/95 fixed inset-x-0 bottom-0 z-30 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <Button asChild className="w-full">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
