import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { typography } from "../lib/band/config";
import { fontFileProblems } from "../lib/init/font-packages";
import {
  assetFace,
  assetWeight,
  cssFamily,
  DEFAULT_TYPOGRAPHY,
  fontImports,
  fontPackages,
  fontStack,
  pickWeights,
  readTypography,
  renderFontsModule,
} from "../lib/theme/fonts";
import { renderThemeCss, validatePalette } from "../lib/theme/palette";
import { FULL_TYPOGRAPHY } from "./fixtures/typography";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reference = validatePalette(JSON.parse(readFileSync(resolve(root, "__tests__/fixtures/reference-palette.json"), "utf-8")));

const problems = (raw: unknown) => {
  const out: string[] = [];
  readTypography(raw, out);
  return out.join("\n");
};
const clone = () => JSON.parse(JSON.stringify(FULL_TYPOGRAPHY)) as Record<string, any>;

describe("readTypography", () => {
  it("accepts the defaults and a full set, and treats a missing wordmark or kicker as none", () => {
    expect(problems(DEFAULT_TYPOGRAPHY)).toBe("");
    expect(problems(FULL_TYPOGRAPHY)).toBe("");
    const bare = { display: DEFAULT_TYPOGRAPHY.display, body: DEFAULT_TYPOGRAPHY.body };
    const out: string[] = [];
    expect(readTypography(bare, out)).toEqual(DEFAULT_TYPOGRAPHY);
    expect(out).toEqual([]);
  });

  it("sorts and de-duplicates weights", () => {
    const t = clone();
    t.display.weights = [800, 400, 800, 600];
    expect(readTypography(t, [])).toMatchObject({ display: { weights: [400, 600, 800] } });
  });

  it("lists every problem at once, by path", () => {
    const t = clone();
    t.display.id = "Encode Sans";
    t.body.family = 'Evil"; } body { x: y';
    t.body.category = "fancy";
    t.wordmark.uppercase = "yes";
    t.kicker.weights = [];
    t.kicker.variable = "no";
    const out = problems(t);
    expect(out).toContain("typography.display.id must be a Fontsource id");
    expect(out).toContain("typography.body.family must be the font's name");
    expect(out).toContain("typography.body.category must be one of");
    expect(out).toContain("typography.wordmark.uppercase must be true or false");
    expect(out).toContain("typography.kicker.weights must be a non-empty list");
    expect(out).toContain("typography.kicker.variable must be true or false");
  });

  it("rejects a family or id that could break out of the CSS or the package name", () => {
    for (const bad of ["a/b", "../x", "A B", "x;y", "-lead", ""]) {
      const t = clone();
      t.display.id = bad;
      expect(problems(t), bad).toContain("typography.display.id");
    }
    for (const bad of ['a"b', "a\\b", "a;b", "a}b", "a\nb", ""]) {
      const t = clone();
      t.display.family = bad;
      expect(problems(t), JSON.stringify(bad)).toContain("typography.display.family");
    }
  });

  it("says what replaced the old on/off switches, and rejects unknown roles and settings", () => {
    const old = { ...DEFAULT_TYPOGRAPHY, wordmarkFace: true, accentFace: false } as unknown;
    expect(problems(old)).toContain("typography.wordmarkFace was replaced by typography.wordmark");
    expect(problems(old)).toContain("typography.accentFace was replaced by typography.kicker");
    const t = clone();
    t.footer = t.body;
    t.display.weight = 700;
    expect(problems(t)).toContain("typography.footer is not a known type role");
    expect(problems(t)).toContain("typography.display.weight is not a known setting");
    expect(problems(null)).toBe("typography must be an object");
    expect(problems({ display: DEFAULT_TYPOGRAPHY.display })).toContain("typography.body must be an object");
  });
});

describe("font stacks", () => {
  it("names a variable face as Fontsource declares it, and a static one plainly", () => {
    expect(cssFamily(DEFAULT_TYPOGRAPHY.body)).toBe("Space Grotesk Variable");
    expect(cssFamily(DEFAULT_TYPOGRAPHY.display)).toBe("Encode Sans Expanded");
  });

  it("falls back to a generic of the same kind", () => {
    expect(fontStack(DEFAULT_TYPOGRAPHY.display)).toBe('"Encode Sans Expanded", system-ui, sans-serif');
    expect(fontStack({ ...DEFAULT_TYPOGRAPHY.display, category: "serif" })).toContain("Georgia, serif");
    expect(fontStack({ ...DEFAULT_TYPOGRAPHY.display, category: "monospace" })).toContain("ui-monospace");
  });
});

describe("pickWeights", () => {
  it("picks the nearest available weight for each one wanted", () => {
    expect(pickWeights([300, 400, 500, 600, 700], [600, 700, 800])).toEqual([600, 700]);
    expect(pickWeights([400, 700], [600, 700, 800])).toEqual([700]);
    expect(pickWeights([100, 200, 300, 400, 500, 600, 700, 800, 900], [600, 700, 800])).toEqual([600, 700, 800]);
  });

  it("gives a single-weight face its one weight, and breaks a tie towards the heavier", () => {
    expect(pickWeights([400], [600, 700, 800])).toEqual([400]);
    expect(pickWeights([700], [400])).toEqual([700]);
    expect(pickWeights([700, 900], [800])).toEqual([900]);
  });
});

describe("generated files", () => {
  it("imports one file per weight for a static face and one for a variable face, once each", () => {
    expect(fontImports(DEFAULT_TYPOGRAPHY)).toEqual([
      "@fontsource/encode-sans-expanded/600.css",
      "@fontsource/encode-sans-expanded/700.css",
      "@fontsource/encode-sans-expanded/800.css",
      "@fontsource-variable/space-grotesk",
    ]);
    const same = { ...DEFAULT_TYPOGRAPHY, wordmark: { ...DEFAULT_TYPOGRAPHY.display, uppercase: true } };
    expect(fontImports(same)).toEqual(fontImports(DEFAULT_TYPOGRAPHY));
    expect(fontImports(FULL_TYPOGRAPHY)).toEqual([...fontImports(DEFAULT_TYPOGRAPHY), "@fontsource-variable/unbounded", "@fontsource/unifrakturcook/700.css"]);
  });

  it("renders the font tokens, with the wordmark and kicker following the display face when off", () => {
    const off = renderThemeCss(reference, DEFAULT_TYPOGRAPHY);
    expect(off).toContain('--font-display: "Encode Sans Expanded", system-ui, sans-serif;');
    expect(off).toContain('--font-body: "Space Grotesk Variable", system-ui, sans-serif;');
    expect(off).toContain("--font-wordmark: var(--font-display);");
    expect(off).toContain("--font-kicker: var(--font-display);");
    const on = renderThemeCss(reference, FULL_TYPOGRAPHY);
    expect(on).toContain('--font-wordmark: "Unbounded Variable", system-ui, sans-serif;');
    expect(on).toContain('--font-kicker: "UnifrakturCook", system-ui, sans-serif;');
  });

  it("is what the committed design-system/fonts.ts contains (run `pnpm theme` after editing band.config.json)", () => {
    expect(readFileSync(resolve(root, "design-system/fonts.ts"), "utf-8")).toBe(renderFontsModule(typography));
  });

  it("draws the icons and card in the wordmark face, or the display face as typed", () => {
    expect(assetFace(DEFAULT_TYPOGRAPHY)).toMatchObject({ id: "encode-sans-expanded", uppercase: false });
    expect(assetFace(FULL_TYPOGRAPHY)).toMatchObject({ id: "unbounded", uppercase: true });
    expect(assetWeight(DEFAULT_TYPOGRAPHY)).toBe(800);
    expect(assetWeight({ ...DEFAULT_TYPOGRAPHY, display: { ...DEFAULT_TYPOGRAPHY.display, weights: [400, 700] } })).toBe(700);
  });

  it("needs the static package of the asset face as a dev dependency only when the site ships the variable one", () => {
    expect(fontPackages(DEFAULT_TYPOGRAPHY)).toEqual({
      dependencies: ["@fontsource-variable/space-grotesk", "@fontsource/encode-sans-expanded"],
      devDependencies: [],
    });
    expect(fontPackages(FULL_TYPOGRAPHY)).toEqual({
      dependencies: ["@fontsource-variable/space-grotesk", "@fontsource-variable/unbounded", "@fontsource/encode-sans-expanded", "@fontsource/unifrakturcook"],
      devDependencies: ["@fontsource/unbounded"],
    });
  });
});

describe("the faces band.config.json chose", () => {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
  const needed = fontPackages(typography);

  it("are declared in package.json, so a fresh clone installs them", () => {
    for (const name of needed.dependencies) expect(pkg.dependencies, `${name} must be a dependency (the site loads it)`).toHaveProperty([name]);
    for (const name of needed.devDependencies) expect(pkg.devDependencies, `${name} must be a dev dependency (the icons are drawn from it)`).toHaveProperty([name]);
  });

  it("are installed, with every file fonts.ts imports, declaring the family the CSS stack names", () => {
    expect(fontFileProblems(root, typography)).toEqual([]);
  });
});
