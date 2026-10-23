/**
 * WCAG contrast maths and an OKLCH lightness lift. The palette generator uses the lift to repair a
 * failing colour without changing its hue: OKLCH lightness is perceptual, so moving L alone keeps
 * the colour recognisably the same where HSL lightness would shift it.
 */

export type Rgb = readonly [number, number, number];

const HEX = /^#[0-9a-f]{6}$/;

export const isHex = (value: string): boolean => HEX.test(value);

export function hexToRgb(hex: string): Rgb {
  if (!isHex(hex)) throw new Error(`Not a #rrggbb colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type Lch = readonly [number, number, number];

// Björn Ottosson's OKLab, https://bottosson.github.io/posts/oklab/
export function hexToOklch(hex: string): Lch {
  const [r, g, b] = hexToRgb(hex).map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}

function oklchToLinearRgb([L, C, h]: Lch): Rgb {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

// Keeps L and hue and gives up chroma until the colour fits sRGB, so a lifted colour never clips to a different hue.
export function oklchToHex(lch: Lch): string {
  const [L, C, h] = lch;
  let lo = 0;
  let hi = C;
  if (!inGamut(oklchToLinearRgb([L, C, h]))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearRgb([L, mid, h]))) lo = mid;
      else hi = mid;
    }
  } else {
    lo = C;
  }
  return rgbToHex(oklchToLinearRgb([L, lo, h]).map((v) => fromLinear(Math.min(1, Math.max(0, v))) * 255) as unknown as Rgb);
}

/**
 * Returns `hex` unchanged if it already reaches `min` against `bg`, otherwise the closest colour of the
 * same hue with higher lightness that does, or null if even white cannot reach it. Assumes a dark
 * background, which is the only theme this design system has.
 */
export function liftToContrast(hex: string, bg: string, min: number): string | null {
  if (contrastRatio(hex, bg) >= min) return hex;
  const [L, C, h] = hexToOklch(hex);
  if (contrastRatio(oklchToHex([1, C, h]), bg) < min) return null;
  let lo = L;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(oklchToHex([mid, C, h]), bg) >= min) hi = mid;
    else lo = mid;
  }
  const lifted = oklchToHex([hi, C, h]);
  return contrastRatio(lifted, bg) >= min ? lifted : null;
}
