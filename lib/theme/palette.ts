/**
 * Palette for the design system, by role. band.config.json holds the author's colours; this module
 * validates them, repairs any text colour that would fail WCAG AA, and renders the theme CSS.
 * It never returns a palette with a failing pair: it either lifts the colour or throws.
 */
import { contrastRatio, isHex, liftToContrast, relativeLuminance } from "./contrast";
import { DEFAULT_TYPOGRAPHY, fontStack, type Typography } from "./fonts";

export const PALETTE_KEYS = [
  "void",
  "surface",
  "raised",
  "line",
  "text",
  "muted",
  "dim",
  "accent",
  "accent-2",
  "accent-3",
  "metal-hi",
  "metal-mid",
  "metal-lo",
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];
export type Palette = Record<PaletteKey, string>;

export const SURFACES = ["void", "surface", "raised"] as const;

// 4.5:1 everywhere text can land, dim included. The reference palette already clears it on all three
// surfaces (dim is 5.3:1 on raised), so no token needs the 3:1 large-text allowance.
export const MIN_RATIO = 4.5;

// Text-bearing colours: anything set as the colour of type, or filling gradient-clipped type.
const ON_SURFACE: readonly PaletteKey[] = ["text", "muted", "dim", "accent", "accent-2", "accent-3", "metal-hi", "metal-mid", "metal-lo"];

// Colours that carry dark text (buttons, badges, the ticket panel and the skip link set `text-void` on them).
const CARRIES_VOID_TEXT: readonly PaletteKey[] = ["accent", "accent-3", "metal-hi"];

// A dark theme is the only one this system has; a light surface would need different components.
const MAX_SURFACE_LUMINANCE = 0.1;

export type Pair = { fg: PaletteKey; bg: PaletteKey };

export const PAIRS: readonly Pair[] = [
  ...ON_SURFACE.flatMap((fg) => SURFACES.map((bg) => ({ fg, bg }))),
  ...CARRIES_VOID_TEXT.map((bg) => ({ fg: "void" as const, bg })),
];

export type PairResult = Pair & { ratio: number; ok: boolean };

export class PaletteError extends Error {
  constructor(readonly problems: string[]) {
    super(`Palette rejected:\n- ${problems.join("\n- ")}`);
  }
}

export function validatePalette(raw: unknown): Palette {
  const problems: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new PaletteError(["palette must be an object of colour roles"]);
  }
  const obj = raw as Record<string, unknown>;
  const out: Partial<Palette> = {};
  for (const key of PALETTE_KEYS) {
    const value = obj[key];
    if (typeof value !== "string") problems.push(`palette.${key} is missing`);
    else if (!isHex(value.toLowerCase())) problems.push(`palette.${key} must be a #rrggbb colour, got ${JSON.stringify(value)}`);
    else out[key] = value.toLowerCase();
  }
  for (const key of Object.keys(obj)) {
    if (!(PALETTE_KEYS as readonly string[]).includes(key)) problems.push(`palette.${key} is not a known role`);
  }
  if (problems.length) throw new PaletteError(problems);
  return out as Palette;
}

export function checkPalette(palette: Palette): PairResult[] {
  return PAIRS.map((pair) => {
    const ratio = contrastRatio(palette[pair.fg], palette[pair.bg]);
    return { ...pair, ratio, ok: ratio >= MIN_RATIO };
  });
}

export type Adjustment = { key: PaletteKey; from: string; to: string; reason: string };

/** A ratio floored to one decimal, never rounded up: a 4.49 must not read as 4.5, or a note would overstate a passing ratio. */
export const fmt = (n: number) => (Math.floor(n * 10) / 10).toFixed(1);

/** Lifts failing text colours, keeping their hue, or throws a PaletteError saying why it cannot. */
export function resolvePalette(input: Palette): { palette: Palette; adjustments: Adjustment[] } {
  const problems: string[] = [];
  for (const key of SURFACES) {
    if (relativeLuminance(input[key]) > MAX_SURFACE_LUMINANCE) {
      problems.push(`palette.${key} (${input[key]}) is too light: this design system is dark-only, so surfaces must be dark`);
    }
  }
  if (problems.length) throw new PaletteError(problems);

  // Contrast is judged against the lightest surface, so passing there passes on all three.
  const lightest = [...SURFACES].sort((a, b) => relativeLuminance(input[b]) - relativeLuminance(input[a]))[0];
  const palette = { ...input };
  const adjustments: Adjustment[] = [];
  for (const key of ON_SURFACE) {
    const ratio = contrastRatio(input[key], input[lightest]);
    if (ratio >= MIN_RATIO) continue;
    const lifted = liftToContrast(input[key], input[lightest], MIN_RATIO);
    if (lifted === null) {
      problems.push(`palette.${key} (${input[key]}) cannot reach ${MIN_RATIO}:1 on ${lightest} (${input[lightest]}) even at full lightness; darken the surface`);
      continue;
    }
    palette[key] = lifted;
    adjustments.push({ key, from: input[key], to: lifted, reason: `${fmt(ratio)}:1 on ${lightest}, needs ${MIN_RATIO}:1` });
  }
  if (problems.length) throw new PaletteError(problems);

  const failing = checkPalette(palette).filter((p) => !p.ok);
  if (failing.length) {
    throw new PaletteError(failing.map((p) => `${p.fg} on ${p.bg} is ${fmt(p.ratio)}:1, needs ${MIN_RATIO}:1`));
  }
  return { palette, adjustments };
}

const ratioNote = (palette: Palette, key: PaletteKey) => {
  const bgs = SURFACES.map((s) => contrastRatio(palette[key], palette[s]));
  return `${fmt(contrastRatio(palette[key], palette.surface))}:1 on surface, ${fmt(Math.min(...bgs))}:1 worst case`;
};

export const GENERATED_HEADER = `/* GENERATED by scripts/generate-theme.ts from band.config.json. Do not edit by hand; run \`pnpm theme\`. */`;

export function renderThemeCss(palette: Palette, type: Typography = DEFAULT_TYPOGRAPHY): string {
  const c = (key: PaletteKey) => `  --color-${key}: ${palette[key]};`;
  const noted = (key: PaletteKey) => `${c(key).padEnd(34)}/* ${ratioNote(palette, key)} */`;
  return `${GENERATED_HEADER}
/*
 * Every text colour clears WCAG AA (${MIN_RATIO}:1) on all three surfaces. Ratios are floored to one
 * decimal, so a note never overstates; "worst case" is the lightest surface (raised).
 */
@theme {
  /* Surfaces */
${["void", "surface", "raised", "line"].map((k) => c(k as PaletteKey)).join("\n")}

  /* Text */
${["text", "muted", "dim"].map((k) => noted(k as PaletteKey)).join("\n")}

  /* Accents, by role. accent is the primary (kickers, primary action), accent-2 links and labels,
     accent-3 focus and secondary actions. Components never name a hue. */
${["accent", "accent-2", "accent-3"].map((k) => noted(k as PaletteKey)).join("\n")}

  /* Metal (metallic neutral). metal-mid is the gradient's bright third stop. */
${["metal-hi", "metal-lo", "metal-mid"].map((k) => noted(k as PaletteKey)).join("\n")}

  /* Type, by role, from band.config.json. The wordmark and kicker faces are optional; when off, those roles use
     the display face, so components never need to know which was chosen. */
  --font-display: ${fontStack(type.display)};
  --font-body: ${fontStack(type.body)};
  --font-wordmark: ${type.wordmark ? fontStack(type.wordmark) : "var(--font-display)"};
  --font-kicker: ${type.kicker ? fontStack(type.kicker) : "var(--font-display)"};

  --shadow-glow-accent: 0 0 24px color-mix(in srgb, var(--color-accent) 45%, transparent);
  --shadow-glow-accent-3: 0 0 24px color-mix(in srgb, var(--color-accent-3) 35%, transparent);
}

:root {
  --grad-accent: linear-gradient(110deg, var(--color-accent) 0%, var(--color-accent-2) 55%, var(--color-accent-3) 100%);
  --grad-metal: linear-gradient(180deg, var(--color-metal-hi) 0%, var(--color-metal-lo) 55%, var(--color-metal-mid) 100%);
}
`;
}
