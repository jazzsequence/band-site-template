/**
 * Proposes a full palette from a hue, so /init-band can offer a few directions with real contrast ratios
 * instead of inventing hex values. Everything is built in OKLCH: surfaces carry a faint cast of the main
 * hue, text and metal are near-neutral with the same cast, and the three accents are spread around it.
 * The result is not final: it still goes through resolvePalette, which lifts or rejects whatever fails AA.
 */
import { oklchToHex } from "../theme/contrast";
import type { Palette } from "../theme/palette";

export const LOUDNESS = ["quiet", "balanced", "loud"] as const;
export const SCHEMES = ["analogous", "complement", "triad", "mono"] as const;
export type Loudness = (typeof LOUDNESS)[number];
export type Scheme = (typeof SCHEMES)[number];

// [lightness, chroma] of the primary accent. Louder means more chroma and a lighter, hotter colour.
const ACCENT: Record<Loudness, [number, number]> = { quiet: [0.74, 0.08], balanced: [0.76, 0.16], loud: [0.72, 0.28] };

// Hue offsets of accent-2 and accent-3 from the primary.
const OFFSETS: Record<Scheme, [number, number]> = {
  analogous: [45, 100],
  complement: [180, 215],
  triad: [120, 240],
  mono: [20, 40],
};

const wrap = (h: number) => ((h % 360) + 360) % 360;

export function suggestPalette({ hue, loudness = "balanced", scheme = "analogous" }: { hue: number; loudness?: Loudness; scheme?: Scheme }): Palette {
  if (!Number.isFinite(hue)) throw new Error("hue must be a number of degrees");
  const h = wrap(hue);
  const [aL, aC] = ACCENT[loudness];
  const [o2, o3] = OFFSETS[scheme];
  const at = (L: number, C: number, hh = h) => oklchToHex([L, C, wrap(hh)]);
  return {
    void: at(0.12, 0.02),
    surface: at(0.16, 0.03),
    raised: at(0.2, 0.04),
    line: at(0.32, 0.07),
    text: at(0.96, 0.015),
    muted: at(0.8, 0.04),
    dim: at(0.67, 0.045),
    accent: at(aL, aC),
    "accent-2": at(Math.min(0.9, aL + 0.04), aC * 0.8, h + o2),
    "accent-3": at(Math.min(0.92, aL + 0.1), aC * 0.7, h + o3),
    "metal-hi": at(0.96, 0.012),
    "metal-mid": at(0.88, 0.02),
    "metal-lo": at(0.62, 0.03),
  };
}
