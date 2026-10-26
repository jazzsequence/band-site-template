import { describe, expect, it } from "vitest";

import { LOUDNESS, SCHEMES, suggestPalette } from "../lib/init/palette-suggest";
import { hexToOklch } from "../lib/theme/contrast";
import { PALETTE_KEYS, checkPalette, resolvePalette, validatePalette } from "../lib/theme/palette";

describe("suggestPalette", () => {
  it("returns every role as a valid #rrggbb palette", () => {
    const p = suggestPalette({ hue: 200 });
    expect(Object.keys(p).sort()).toEqual([...PALETTE_KEYS].sort());
    expect(validatePalette(p)).toEqual(p);
  });

  it("always has dark surfaces the gate accepts, for any hue, loudness and scheme", () => {
    for (let hue = 0; hue < 360; hue += 15) {
      for (const loudness of LOUDNESS) {
        for (const scheme of SCHEMES) {
          const { palette } = resolvePalette(suggestPalette({ hue, loudness, scheme }));
          expect(checkPalette(palette).every((r) => r.ok), `${hue} ${loudness} ${scheme}`).toBe(true);
        }
      }
    }
  });

  it("needs little or no repair: the proposal is already close to passing", () => {
    let adjusted = 0;
    for (let hue = 0; hue < 360; hue += 30) adjusted += resolvePalette(suggestPalette({ hue })).adjustments.length;
    expect(adjusted).toBeLessThan(6);
  });

  it("carries the requested hue in the surfaces and the primary accent", () => {
    const near = (hex: string, hue: number, tol = 25) => {
      const diff = Math.abs(((hexToOklch(hex)[2] - hue + 540) % 360) - 180);
      return diff < tol;
    };
    const p = suggestPalette({ hue: 145, loudness: "loud" });
    expect(near(p.accent, 145)).toBe(true);
    expect(near(p.surface, 145, 40)).toBe(true);
  });

  it("louder means a more saturated primary accent", () => {
    const chroma = (l: (typeof LOUDNESS)[number]) => hexToOklch(suggestPalette({ hue: 30, loudness: l }).accent)[1];
    expect(chroma("quiet")).toBeLessThan(chroma("balanced"));
    expect(chroma("balanced")).toBeLessThan(chroma("loud"));
  });

  it("spreads the accents by scheme", () => {
    const hues = (scheme: (typeof SCHEMES)[number]) => {
      const p = suggestPalette({ hue: 30, scheme, loudness: "loud" });
      return [p.accent, p["accent-2"], p["accent-3"]].map((x) => hexToOklch(x)[2]);
    };
    const apart = (s: (typeof SCHEMES)[number]) => {
      const [a, , c] = hues(s);
      const d = Math.abs(c - a) % 360;
      return Math.min(d, 360 - d);
    };
    // Angular distance of accent-3 from the primary: a complement sits far across the wheel, a mono scheme close by.
    expect(apart("complement")).toBeGreaterThan(apart("triad") - 1);
    expect(apart("triad")).toBeGreaterThan(apart("analogous"));
    expect(apart("analogous")).toBeGreaterThan(apart("mono"));
  });

  it("rejects a non-numeric hue", () => {
    expect(() => suggestPalette({ hue: Number.NaN })).toThrow(/hue/);
  });
});
