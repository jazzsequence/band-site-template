import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb, liftToContrast, relativeLuminance, rgbToHex } from "../lib/theme/contrast";

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // #767676 on white is the well-known smallest grey that passes 4.5:1.
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#ff5fb4", "#0e0a18")).toBeCloseTo(contrastRatio("#0e0a18", "#ff5fb4"), 10);
  });

  it("round-trips hex and rejects anything but #rrggbb", () => {
    expect(rgbToHex(hexToRgb("#c0ffee"))).toBe("#c0ffee");
    expect(() => hexToRgb("#fff")).toThrow();
    expect(() => hexToRgb("a98bff")).toThrow();
    expect(relativeLuminance("#000000")).toBe(0);
  });
});

describe("liftToContrast", () => {
  const bg = "#17112a";

  it("returns a passing colour unchanged", () => {
    expect(liftToContrast("#ff5fb4", bg, 4.5)).toBe("#ff5fb4");
  });

  it("lifts a failing colour to the minimum, no further than needed", () => {
    const lifted = liftToContrast("#5a2a8a", bg, 4.5);
    expect(lifted).not.toBeNull();
    expect(contrastRatio(lifted as string, bg)).toBeGreaterThanOrEqual(4.5);
    // Closest passing lightness: the result sits just above the threshold, not at white.
    expect(contrastRatio(lifted as string, bg)).toBeLessThan(4.7);
  });

  it("keeps the hue of the colour it lifts", () => {
    const hue = (hex: string) => {
      const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      if (d === 0) return 0;
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    const lifted = liftToContrast("#5a2a8a", bg, 4.5) as string;
    expect(Math.abs(hue(lifted) - hue("#5a2a8a"))).toBeLessThan(12);
  });

  it("gives up when even white cannot reach the ratio", () => {
    expect(liftToContrast("#808080", "#9a9a9a", 7)).toBeNull();
  });
});
