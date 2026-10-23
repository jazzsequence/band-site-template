/**
 * Colours are named by role (accent, accent-2, accent-3, metal), never by hue, so a band can
 * re-theme the design system by changing token values. Components know roles only. This guard
 * fails if a hue-named token or class comes back, or if a literal from the original palette is
 * written outside the few files that legitimately hold palette values.
 */
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HUES = "magenta|violet|cyan|chrome-hi|chrome-lo";
// Tokens and utilities named after a hue: --color-magenta, --shadow-glow-cyan, --grad-neon,
// text-violet, hover:bg-cyan, [&_a]:text-cyan, .text-chrome, .text-neon.
const HUE_NAMED = new RegExp(
  [
    `--color-(?:${HUES})\\b`,
    "--shadow-glow-(?:magenta|cyan)\\b",
    "--grad-(?:neon|chrome)\\b",
    `(?:^|[\\s"'\`:.\\]])(?:text|bg|border|ring|outline|stroke|fill|from|via|to|decoration|caret|divide|shadow-glow)-(?:${HUES})\\b`,
    "(?:^|[\\s\"'`.])\\.?text-(?:chrome|neon)\\b",
  ].join("|"),
  "i",
);

// Literals from the original palette: the ds.css token values and the gradient's third stop.
const PALETTE_LITERAL = /#(?:ff3fa4|a98bff|3ef0ff|f1effa|8d8aa6|d9d6ea)\b|rgb\(\s*(?:255\s+63\s+164|62\s+240\s+255)\b/i;

// Files allowed to hold palette literals, and why. Hue-named tokens are never allowed anywhere.
const PALETTE_LITERAL_ALLOWED: Record<string, string> = {
  "design-system/ds.css": "defines the token values",
  "design-system/Foundations.stories.tsx": "documents the swatches; replaced when the story renders the active palette",
  "scripts/make-brand-assets.mjs": "generates the favicon and social card, which cannot read CSS variables",
  "app/icon.svg": "generated brand asset",
  "e2e/hero-contrast.spec.ts": "measures contrast against the token values",
};

const SELF = "__tests__/colour-token-roles.test.ts";

const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf-8" })
  .split("\0")
  .filter((f) => f && f !== SELF && !/\.(png|jpe?g|webp|woff2?|ico|m4a|lock|yaml)$/i.test(f) && f !== "pnpm-lock.yaml");

const read = (f: string) => {
  try {
    return readFileSync(resolve(root, f), "utf-8");
  } catch {
    return "";
  }
};

describe("the guard patterns", () => {
  it.each([
    "--color-magenta: #fff",
    "var(--color-cyan)",
    "--shadow-glow-magenta",
    "bg-[image:var(--grad-neon)]",
    'className="text-violet hover:text-cyan"',
    'className="x hover:bg-chrome-hi"',
    'className="[&_a]:text-cyan"',
    'className="prose-a:text-cyan"',
    'className="text-chrome font-display"',
    ".text-neon {",
  ])("flags the hue name in %s", (src) => {
    expect(src).toMatch(HUE_NAMED);
  });

  it.each([
    'className="text-accent hover:text-accent-3 text-metal"',
    "--color-accent-2: #a98bff",
    "var(--grad-accent)",
    'className="shadow-glow-accent text-accent-gradient"',
    "components/site/chrome.tsx",
    'import { SiteChrome } from "./chrome"',
  ])("leaves the role name in %s alone", (src) => {
    expect(src).not.toMatch(HUE_NAMED);
  });

  it("flags the old palette literals in hex and rgb form", () => {
    for (const s of ["#ff3fa4", "#FF3FA4", "#a98bff", "#3ef0ff", "#f1effa", "#8d8aa6", "#d9d6ea", "rgb(255 63 164 / 0.45)", "rgb(62 240 255 / 0.35)"]) {
      expect(s).toMatch(PALETTE_LITERAL);
    }
    expect("#ff3fa4aa".match(PALETTE_LITERAL)).toBeNull();
    expect("#0e0a18").not.toMatch(PALETTE_LITERAL);
  });
});

describe("tracked files use colour roles", () => {
  it("scans something", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("names no colour by hue", () => {
    const offenders = files.filter((f) => HUE_NAMED.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("writes no original-palette literal outside the allowlist", () => {
    const offenders = files.filter((f) => !(f in PALETTE_LITERAL_ALLOWED) && PALETTE_LITERAL.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("keeps the allowlist honest: every entry still exists and still holds a literal", () => {
    for (const f of Object.keys(PALETTE_LITERAL_ALLOWED)) {
      expect(files, `${f} is allowlisted but not tracked`).toContain(f);
      expect(read(f), `${f} no longer holds a palette literal; drop it from the allowlist`).toMatch(PALETTE_LITERAL);
    }
  });
});
