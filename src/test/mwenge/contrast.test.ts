import { describe, expect, it } from "vitest";
import { swatches } from "@/lib/design/swatches";
import { contrast, readTokens } from "./helpers";

const t = readTokens();
const white = "#ffffff";

/** Every foreground/background pairing used by the components, with its WCAG AA minimum. */
const text: Array<[string, string, string, number]> = [
  ["body text on ivory", "ink", "ivory", 4.5],
  ["secondary text on ivory", "slate", "ivory", 4.5],
  ["secondary text on sand", "slate", "sand", 4.5],
  ["secondary text on white", "slate", "white", 4.5],
  ["primary button: fairway on gold", "fairway", "gold", 4.5],
  ["primary button hover: fairway on gold-bright", "fairway", "gold-bright", 4.5],
  ["primary button pressed: fairway on gold-deep", "fairway", "gold-deep", 4.5],
  ["dark button: ivory on fairway", "ivory", "fairway", 4.5],
  ["footer text: ivory on night", "ivory", "night", 4.5],
  ["gold text on fairway", "gold", "fairway", 4.5],
  ["gold text on night", "gold", "night", 4.5],
  ["antique gold text on ivory", "gold-ink", "ivory", 4.5],
  ["link: canopy on ivory", "canopy", "ivory", 4.5],
  ["earth badge: white on earth", "white", "earth", 4.5],
  ["badge: fairway on sand", "fairway", "sand", 4.5],
  ["error text on white", "danger", "white", 4.5],
  ["warning icon/text on white", "warning", "white", 4.5],
  ["success on white", "success", "white", 4.5],
  ["info on white", "info", "white", 4.5],
];

function resolve(name: string): string {
  return name === "white" ? white : (t[name] as string);
}

describe("palette contrast (WCAG 2.1 AA)", () => {
  it.each(text)("%s", (_label, fg, bg, min) => {
    expect(contrast(resolve(fg), resolve(bg))).toBeGreaterThanOrEqual(min);
  });

  it("form control border meets 3:1 non-text contrast on white and ivory", () => {
    expect(contrast(t["field"]!, white)).toBeGreaterThanOrEqual(3);
    expect(contrast(t["field"]!, t["ivory"]!)).toBeGreaterThanOrEqual(3);
  });

  it("focus ring colours meet 3:1 on the surfaces they appear on", () => {
    expect(contrast(t["canopy"]!, t["ivory"]!)).toBeGreaterThanOrEqual(3);
    expect(contrast(t["gold"]!, t["fairway"]!)).toBeGreaterThanOrEqual(3);
    expect(contrast(t["gold"]!, t["night"]!)).toBeGreaterThanOrEqual(3);
  });

  it("antique gold text is safe on both ivory and sand", () => {
    expect(contrast(t["gold-ink"]!, t["ivory"]!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t["gold-ink"]!, t["sand"]!)).toBeGreaterThanOrEqual(4.5);
  });

  it("style guide swatches match the CSS tokens", () => {
    for (const swatch of swatches) {
      expect(t[swatch.token], swatch.token).toBe(swatch.hex);
    }
  });
});
