import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "../lib/theme/contrast";
import {
  MIN_RATIO,
  PAIRS,
  PALETTE_KEYS,
  PaletteError,
  checkPalette,
  renderThemeCss,
  resolvePalette,
  validatePalette,
  type Palette,
} from "../lib/theme/palette";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const paris = validatePalette(JSON.parse(readFileSync(resolve(root, "band.config.json"), "utf-8")).palette);

describe("the PARIS palette (regression fixture)", () => {
  it("validates and has every role", () => {
    expect(Object.keys(paris).sort()).toEqual([...PALETTE_KEYS].sort());
  });

  it("clears AA on every pair with no adjustment", () => {
    const { palette, adjustments } = resolvePalette(paris);
    expect(adjustments).toEqual([]);
    expect(palette).toEqual(paris);
    const failing = checkPalette(palette).filter((p) => !p.ok);
    expect(failing).toEqual([]);
  });

  it("keeps the ratios the original stylesheet documented (to within its rounding)", () => {
    const on = (fg: keyof Palette) => contrastRatio(paris[fg], paris.surface);
    const documented = { text: 17.5, muted: 9.4, dim: 5.7, accent: 6.0, "accent-2": 7.3, "accent-3": 14.1 } as const;
    for (const [key, ratio] of Object.entries(documented)) expect(Math.abs(on(key as keyof Palette) - ratio)).toBeLessThan(0.1);
  });

  it("is what the committed theme.generated.css contains (run `pnpm theme` after editing band.config.json)", () => {
    const committed = readFileSync(resolve(root, "design-system/theme.generated.css"), "utf-8");
    expect(committed).toBe(renderThemeCss(resolvePalette(paris).palette));
  });

  it("renders the token values, derived glows and gradients, and ratio notes", () => {
    const css = renderThemeCss(paris);
    for (const key of PALETTE_KEYS) expect(css).toContain(`--color-${key}: ${paris[key]};`);
    expect(css).toContain("--shadow-glow-accent: 0 0 24px color-mix(in srgb, var(--color-accent) 45%, transparent);");
    expect(css).toContain("--grad-accent: linear-gradient(110deg, var(--color-accent) 0%, var(--color-accent-2) 55%, var(--color-accent-3) 100%);");
    expect(css).toMatch(/--color-text: #f5f0ff;\s+\/\* 17\.4:1 on surface, 16\.3:1 worst case \*\//);
    expect(css.startsWith("/* GENERATED")).toBe(true);
  });
});

describe("validatePalette", () => {
  it("lists every problem at once", () => {
    const bad = { ...paris, accent: "red", "accent-2": undefined, wat: "#000000" } as unknown;
    try {
      validatePalette(bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(PaletteError);
      const msg = (e as PaletteError).message;
      expect(msg).toContain("palette.accent must be a #rrggbb colour");
      expect(msg).toContain("palette.accent-2 is missing");
      expect(msg).toContain("palette.wat is not a known role");
    }
  });

  it("normalises case and rejects non-objects", () => {
    expect(validatePalette({ ...paris, accent: paris.accent.toUpperCase() }).accent).toBe(paris.accent);
    expect(() => validatePalette(null)).toThrow(PaletteError);
    expect(() => validatePalette([])).toThrow(PaletteError);
  });
});

describe("resolvePalette", () => {
  it("lifts a failing colour, keeps passing ones, and reports what it did", () => {
    const dark = { ...paris, accent: "#7a1450", dim: "#4a4468" };
    const { palette, adjustments } = resolvePalette(dark);
    expect(adjustments.map((a) => a.key).sort()).toEqual(["accent", "dim"]);
    expect(adjustments.find((a) => a.key === "accent")?.reason).toMatch(/^\d+\.\d:1 on raised, needs 4\.5:1$/);
    expect(palette.accent).not.toBe(dark.accent);
    expect(palette.text).toBe(dark.text);
    expect(checkPalette(palette).every((p) => p.ok)).toBe(true);
  });

  it("rejects a light surface, saying why", () => {
    expect(() => resolvePalette({ ...paris, surface: "#f5f0ff" })).toThrow(/palette\.surface .* too light: this design system is dark-only/);
  });

  it("lifts everything toward white when the surfaces are as light as a dark theme may be", () => {
    const grey = { ...paris, void: "#4a4a4a", surface: "#505050", raised: "#555555" };
    const { palette, adjustments } = resolvePalette(grey);
    expect(adjustments.length).toBeGreaterThan(0);
    expect(checkPalette(palette).every((p) => p.ok)).toBe(true);
  });

  it("checks that dark text on each accent fill also passes", () => {
    const fills = PAIRS.filter((p) => p.fg === "void").map((p) => p.bg);
    expect(fills.sort()).toEqual(["accent", "accent-3", "metal-hi"]);
  });

  it("never returns a failing palette, whatever it is given", () => {
    // Deterministic pseudo-random palettes: each either throws a PaletteError or passes every pair.
    let seed = 20261023;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const hex = (lo: number, hi: number) =>
      `#${[0, 1, 2].map(() => Math.floor(lo + rand() * (hi - lo)).toString(16).padStart(2, "0")).join("")}`;
    let passed = 0;
    let rejected = 0;
    for (let i = 0; i < 300; i++) {
      const p = { ...paris } as Palette;
      for (const k of PALETTE_KEYS) p[k] = k === "void" || k === "surface" || k === "raised" ? hex(0, 90) : hex(0, 256);
      try {
        const { palette } = resolvePalette(p);
        expect(checkPalette(palette).filter((x) => !x.ok)).toEqual([]);
        passed++;
      } catch (e) {
        expect(e).toBeInstanceOf(PaletteError);
        rejected++;
      }
    }
    expect(passed).toBeGreaterThan(0);
    expect(passed + rejected).toBe(300);
  });

  it("states the AA minimum it enforces", () => {
    expect(MIN_RATIO).toBe(4.5);
  });
});
