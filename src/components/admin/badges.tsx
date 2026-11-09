import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/admin/inbox";

const finished = new Set(["closed", "declined", "not_proceeding", "distributed", "received"]);

/** New items stand out; finished ones recede. */
export function StatusBadge({ status, newStatus }: { status: string; newStatus: string }) {
  const variant = status === newStatus ? "dark" : finished.has(status) ? "outline" : "neutral";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

/** Colour is never the only signal: the word is always shown. */
export function OverdueBadge() {
  return <Badge className="bg-danger text-white">Overdue</Badge>;
}

export function RestrictedBadge() {
  return <Badge variant="earth">Restricted</Badge>;
}
