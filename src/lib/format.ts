import type { Program } from "@/lib/content/types";
import { formatMoney } from "@/lib/money";

const TZ = "Africa/Kampala";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDayMonth(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric" }).format(d),
    month: new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "short" }).format(d),
  };
}

/** Price line for a program. Prices are only shown when the academy has supplied them. */
export function programPrice(program: Pick<Program, "priceUgx" | "priceUsd">): string {
  const parts: string[] = [];
  if (program.priceUgx !== null) parts.push(formatMoney(program.priceUgx, "UGX"));
  if (program.priceUsd !== null) parts.push(formatMoney(program.priceUsd, "USD"));
  return parts.length > 0 ? `From ${parts.join(" / ")}` : "Contact us for pricing";
}

export const audienceLabel = { junior: "Junior", adult: "Adult", corporate: "Corporate" } as const;
