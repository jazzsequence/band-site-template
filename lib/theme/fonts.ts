/**
 * Type for the design system, by role. band.config.json holds the band's choices; this module validates them and
 * turns them into the CSS font stacks and the font-file imports. Every face is a Fontsource package, self-hosted:
 * the CSP is `font-src 'self'` and the site makes no third-party request, so a font that is only served from
 * someone else's CDN (or is a licensed file) is not a face here. Those are added by a design PR after setup.
 *
 * Dependency-free and limited to syntax Node can strip, because scripts/make-brand-assets.mjs imports it directly.
 */

export const FONT_ROLES = ["display", "body", "wordmark", "kicker"] as const;
export type FontRole = (typeof FONT_ROLES)[number];

export const FONT_CATEGORIES = ["sans-serif", "serif", "display", "handwriting", "monospace"] as const;
export type FontCategory = (typeof FONT_CATEGORIES)[number];

/** What the config records about a font: the facts Fontsource published when it was chosen, so no network is needed after that. */
export type FontFace = {
  /** The Fontsource id, which is the package name's suffix: `@fontsource/<id>`. */
  id: string;
  /** The name the font goes by, and the CSS family of its static files. */
  family: string;
  category: FontCategory;
  /** Ship `@fontsource-variable/<id>` (one file, weight axis) instead of one file per weight. */
  variable: boolean;
  /** Every weight the family offers. The ones the site uses are picked from these. */
  weights: number[];
};

export type Typography = {
  /** Headings, buttons and labels. */
  display: FontFace;
  /** Running text. */
  body: FontFace;
  /** The band name only, in flat colour. Absent: the name uses the display face, as typed. */
  wordmark: (FontFace & { uppercase: boolean }) | null;
  /** The small labels above headings, and flourishes. Absent: they use the display face. */
  kicker: FontFace | null;
};

export const DEFAULT_TYPOGRAPHY: Typography = {
  display: { id: "encode-sans-expanded", family: "Encode Sans Expanded", category: "sans-serif", variable: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  body: { id: "space-grotesk", family: "Space Grotesk", category: "sans-serif", variable: true, weights: [300, 400, 500, 600, 700] },
  wordmark: null,
  kicker: null,
};

// The weights each role asks for in the components (font-semibold, font-bold, font-extrabold, ...). A static font ships the
// nearest weight it has to each; a variable font covers its whole range in one file.
export const WANTED_WEIGHTS: Record<FontRole, readonly number[]> = {
  display: [600, 700, 800],
  body: [400, 500, 600, 700],
  wordmark: [800],
  kicker: [400],
};

export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// The family goes inside a double-quoted CSS string and a package-name check, so quotes, backslashes and semicolons are out.
export const FAMILY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .+-]{0,58}$/;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const FACE_KEYS = ["id", "family", "category", "variable", "weights"];

function readFace(raw: unknown, path: string, problems: string[], extra: string[] = []): FontFace | null {
  if (!isObject(raw)) {
    problems.push(`${path} must be an object`);
    return null;
  }
  const before = problems.length;
  const { id, family, category, variable, weights } = raw;
  if (typeof id !== "string" || id.length > 64 || !ID_PATTERN.test(id)) problems.push(`${path}.id must be a Fontsource id (lowercase letters, digits and hyphens, such as "playfair-display")`);
  if (typeof family !== "string" || !FAMILY_PATTERN.test(family)) problems.push(`${path}.family must be the font's name (letters, digits, spaces, "." "+" "-")`);
  if (!(FONT_CATEGORIES as readonly unknown[]).includes(category)) problems.push(`${path}.category must be one of ${FONT_CATEGORIES.join(", ")}`);
  if (typeof variable !== "boolean") problems.push(`${path}.variable must be true or false`);
  if (!Array.isArray(weights) || !weights.length || weights.some((w) => !Number.isInteger(w) || w < 1 || w > 1000)) problems.push(`${path}.weights must be a non-empty list of weights such as 400, 700`);
  for (const key of Object.keys(raw)) if (![...FACE_KEYS, ...extra].includes(key)) problems.push(`${path}.${key} is not a known setting`);
  if (problems.length > before) return null;
  return { id: id as string, family: family as string, category: category as FontCategory, variable: variable as boolean, weights: [...new Set(weights as number[])].sort((a, b) => a - b) };
}

/** Reads the `typography` section of band.config.json, adding every problem it finds to `problems`. */
export function readTypography(raw: unknown, problems: string[]): Typography {
  if (!isObject(raw)) {
    problems.push("typography must be an object");
    return DEFAULT_TYPOGRAPHY;
  }
  // A config written before the faces were selectable says wordmarkFace / accentFace.
  for (const old of ["wordmarkFace", "accentFace"]) {
    if (old in raw) problems.push(`typography.${old} was replaced by typography.${old === "wordmarkFace" ? "wordmark" : "kicker"} (a font, or null for none); see SETUP.md`);
  }
  for (const key of Object.keys(raw)) if (!(FONT_ROLES as readonly string[]).includes(key) && key !== "wordmarkFace" && key !== "accentFace") problems.push(`typography.${key} is not a known type role (${FONT_ROLES.join(", ")})`);

  const display = readFace(raw.display, "typography.display", problems);
  const body = readFace(raw.body, "typography.body", problems);
  let wordmark: Typography["wordmark"] = null;
  if (raw.wordmark !== undefined && raw.wordmark !== null) {
    const face = readFace(raw.wordmark, "typography.wordmark", problems, ["uppercase"]);
    const uppercase = isObject(raw.wordmark) ? raw.wordmark.uppercase : undefined;
    if (typeof uppercase !== "boolean") problems.push("typography.wordmark.uppercase must be true or false");
    if (face && typeof uppercase === "boolean") wordmark = { ...face, uppercase };
  }
  const kicker = raw.kicker === undefined || raw.kicker === null ? null : readFace(raw.kicker, "typography.kicker", problems);
  return { display: display ?? DEFAULT_TYPOGRAPHY.display, body: body ?? DEFAULT_TYPOGRAPHY.body, wordmark, kicker };
}

/** The family name as the Fontsource CSS declares it: the variable packages add " Variable". */
export const cssFamily = (face: FontFace) => (face.variable ? `${face.family} Variable` : face.family);

// What shows while the font loads, or if it never does: a generic of the same kind, so the layout barely moves.
const FALLBACKS: Record<FontCategory, string> = {
  "sans-serif": "system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  monospace: "ui-monospace, monospace",
  display: "system-ui, sans-serif",
  handwriting: "system-ui, sans-serif",
};

export const fontStack = (face: FontFace) => `"${cssFamily(face)}", ${FALLBACKS[face.category]}`;

/** The available weight nearest each wanted one (a tie goes to the heavier), without repeats, ascending. */
export function pickWeights(available: readonly number[], wanted: readonly number[]): number[] {
  const picked = wanted.map((w) => [...available].sort((a, b) => Math.abs(a - w) - Math.abs(b - w) || b - a)[0]);
  return [...new Set(picked)].sort((a, b) => a - b);
}

/** [role, face] for every role that has its own face, in the order they are imported. */
const ownFaces = (t: Typography): [FontRole, FontFace][] =>
  FONT_ROLES.flatMap((role) => (t[role] ? [[role, t[role] as FontFace] as [FontRole, FontFace]] : []));

/** The module specifiers design-system/fonts.ts imports, once each. */
export function fontImports(t: Typography): string[] {
  const out = ownFaces(t).flatMap(([role, face]) =>
    face.variable ? [`@fontsource-variable/${face.id}`] : pickWeights(face.weights, WANTED_WEIGHTS[role]).map((w) => `@fontsource/${face.id}/${w}.css`),
  );
  return [...new Set(out)];
}

export const FONTS_HEADER = "/* GENERATED by scripts/generate-theme.ts from band.config.json. Do not edit by hand; run `pnpm theme`. */";

export function renderFontsModule(t: Typography): string {
  return `${FONTS_HEADER}
/**
 * Self-hosted font files (Fontsource), one import per file the site uses. Import this once from each entry point
 * (Storybook preview and the site layout) rather than from ds.css, so the bundler resolves the font URLs itself.
 */
${fontImports(t)
  .map((spec) => `import "${spec}";`)
  .join("\n")}
`;
}

/** The face the icons and the social card draw the band name with: how the name is set on the site. */
export const assetFace = (t: Typography): FontFace & { uppercase: boolean } => t.wordmark ?? { ...t.display, uppercase: false };

/** The weight the icons and the card use, picked like the site's wordmark weight. */
export const assetWeight = (t: Typography) => pickWeights(assetFace(t).weights, WANTED_WEIGHTS.wordmark)[0];

/** The packages the config needs. The static package of the asset face is a dev dependency when the site itself ships the variable one. */
export function fontPackages(t: Typography): { dependencies: string[]; devDependencies: string[] } {
  const dependencies = new Set(ownFaces(t).map(([, face]) => `${face.variable ? "@fontsource-variable" : "@fontsource"}/${face.id}`));
  const asset = `@fontsource/${assetFace(t).id}`;
  return { dependencies: [...dependencies].sort(), devDependencies: dependencies.has(asset) ? [] : [asset] };
}
