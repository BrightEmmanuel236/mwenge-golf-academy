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
    expect(formatMoney(1999, "USD", "en-US")).toBe("$19.99");
    expect(formatMoney(50_000, "UGX", "en-US")).toContain("50,000");
  });
});
