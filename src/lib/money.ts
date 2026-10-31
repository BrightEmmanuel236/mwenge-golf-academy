/**
 * Money is always stored and passed as an integer in the currency's minor unit.
 * UGX has no minor unit in everyday use (exponent 0); USD uses cents (exponent 2).
 * Minimum donation amounts are PRD assumptions pending client confirmation.
 */
export const currencies = {
  UGX: { code: "UGX", exponent: 0, minDonationMinor: 10_000, symbol: "UGX" },
  USD: { code: "USD", exponent: 2, minDonationMinor: 500, symbol: "$" },
} as const;

export type CurrencyCode = keyof typeof currencies;
export const currencyCodes = Object.keys(currencies) as [CurrencyCode, ...CurrencyCode[]];

/** Convert a user-entered major-unit amount (e.g. 12.5) to integer minor units. Returns null if invalid. */
export function toMinorUnits(major: number, currency: CurrencyCode): number | null {
  if (!Number.isFinite(major) || major < 0) return null;
  const factor = 10 ** currencies[currency].exponent;
  const minor = Math.round(major * factor);
  // Reject inputs with more precision than the currency allows (e.g. UGX 100.5).
  if (Math.abs(minor / factor - major) > 1e-9) return null;
  return minor;
}

export function formatMoney(minor: number, currency: CurrencyCode, locale = "en-UG"): string {
  const { exponent } = currencies[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // ISO codes ("UGX 50,000", "USD 25.00") read the same for local and international donors;
    // the default en-UG locale would otherwise show shillings as "USh".
    currencyDisplay: "code",
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(minor / 10 ** exponent);
}
