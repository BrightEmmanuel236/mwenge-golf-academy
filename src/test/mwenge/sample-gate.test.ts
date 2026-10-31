import { describe, expect, it } from "vitest";
import { excludeSamples, sampleContentAllowed } from "@/lib/content";

describe("sample content gate", () => {
  it("hides isSample items on a production build", () => {
    expect(sampleContentAllowed({ DEV: false })).toBe(false);
    expect(excludeSamples([{ isSample: true }, { isSample: false }], false)).toHaveLength(1);
  });
  it("shows samples in development or with the explicit override", () => {
    expect(sampleContentAllowed({ DEV: true })).toBe(true);
    expect(sampleContentAllowed({ DEV: false, VITE_SHOW_SAMPLE_CONTENT: "true" })).toBe(true);
  });
});
