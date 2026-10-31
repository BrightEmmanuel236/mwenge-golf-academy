import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "@/lib/money";

describe("money", () => {
  it("converts to integer minor units without float drift", () => {
    expect(toMinorUnits(19.99, "USD")).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2, "USD")).toBe(30);
    expect(toMinorUnits(50_000, "UGX")).toBe(50_000);
  });

  it("rejects precision the currency cannot represent, and invalid input", () => {
    expect(toMinorUnits(100.5, "UGX")).toBeNull();
    expect(toMinorUnits(-1, "USD")).toBeNull();
    expect(toMinorUnits(Number.NaN, "USD")).toBeNull();
  });

  it("formats minor units for display", () => {
    // Intl uses a non-breaking space between the code and the amount; normalise it for the check.
    const plain = (text: string) => text.replace(/\s/g, " ");
    expect(plain(formatMoney(1999, "USD", "en-US"))).toBe("USD 19.99");
    expect(plain(formatMoney(50_000, "UGX", "en-US"))).toBe("UGX 50,000");
  });

  it("shows shillings as UGX in the default locale, never USh", () => {
    expect(formatMoney(50_000, "UGX")).toContain("UGX");
    expect(formatMoney(50_000, "UGX")).not.toContain("USh");
  });
});
