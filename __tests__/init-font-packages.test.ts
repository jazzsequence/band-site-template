import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterAll, describe, expect, it } from "vitest";

import { fontFileProblems, syncFontPackages, type PackageJson } from "../lib/init/font-packages";
import { assetFace, assetWeight, cssFamily, DEFAULT_TYPOGRAPHY, type Typography } from "../lib/theme/fonts";
import { FULL_TYPOGRAPHY } from "./fixtures/typography";

// The font files these tests look for are written into a temporary node_modules, so they describe the template's default faces
// whatever typefaces this repo has chosen since (a configured repo no longer has the default packages installed).
const root = mkdtempSync(join(tmpdir(), "font-files-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));
function installFontFiles(t: Typography) {
  const put = (rel: string, content: string) => {
    const file = join(root, "node_modules", rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };
  for (const face of [t.display, t.body, t.wordmark, t.kicker]) {
    if (!face) continue;
    const declares = `@font-face { font-family: '${cssFamily(face)}'; }`;
    if (face.variable) put(`@fontsource-variable/${face.id}/index.css`, declares);
    else for (const w of face.weights) put(`@fontsource/${face.id}/${w}.css`, declares);
  }
  // The icons and the social card are drawn from the static files of the asset face.
  const asset = assetFace(t);
  for (const ext of ["woff2", "woff"]) put(`@fontsource/${asset.id}/files/${asset.id}-latin-${assetWeight(t)}-normal.${ext}`, "");
}
installFontFiles(DEFAULT_TYPOGRAPHY);

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// A package.json as the template ships it once the unused Unbounded and UnifrakturCook packages are gone, plus unrelated entries.
const base = (): PackageJson => ({
  name: "band",
  scripts: { dev: "next dev" },
  dependencies: { "@fontsource-variable/space-grotesk": "^5.3.0", "@fontsource/encode-sans-expanded": "^5.3.0", next: "^16.0.0", react: "^19.0.0" },
  devDependencies: { vitest: "^5.0.0" },
});

describe("syncFontPackages", () => {
  it("changes nothing when the packages already match", () => {
    const out = syncFontPackages(base(), DEFAULT_TYPOGRAPHY, {});
    expect(out.changed).toBe(false);
    expect(out.pkg).toEqual(base());
  });

  it("adds the packages a new choice needs, with the looked-up version, and drops the ones it no longer uses", () => {
    const typography = { ...DEFAULT_TYPOGRAPHY, display: { id: "playfair-display", family: "Playfair Display", category: "serif" as const, variable: true, weights: [400, 700, 900] } };
    const { pkg, changed } = syncFontPackages(base(), typography, { "playfair-display": "5.2.1" });
    expect(changed).toBe(true);
    expect(pkg.dependencies).toEqual({
      "@fontsource-variable/playfair-display": "^5.2.1",
      "@fontsource-variable/space-grotesk": "^5.3.0",
      next: "^16.0.0",
      react: "^19.0.0",
    });
    // The icons are drawn from the static files, which a variable choice does not otherwise install.
    expect(pkg.devDependencies).toEqual({ "@fontsource/playfair-display": "^5.2.1", vitest: "^5.0.0" });
  });

  it("removes every Fontsource package the config does not name, from either section", () => {
    const messy = base();
    messy.dependencies = { ...messy.dependencies, "@fontsource-variable/unbounded": "^5.3.0", "@fontsource/unifrakturcook": "^5.3.0" };
    messy.devDependencies = { ...messy.devDependencies, "@fontsource/unbounded": "^5.3.0" };
    const { pkg, changed } = syncFontPackages(messy, DEFAULT_TYPOGRAPHY, {});
    expect(changed).toBe(true);
    expect(pkg).toEqual(base());
  });

  it("keeps the version a package already has, and moves a package to the section it belongs in", () => {
    const pkg = base();
    pkg.devDependencies = { ...pkg.devDependencies, "@fontsource/encode-sans-expanded": "^5.0.9" };
    delete pkg.dependencies!["@fontsource/encode-sans-expanded"];
    const out = syncFontPackages(pkg, DEFAULT_TYPOGRAPHY, {});
    expect(out.pkg.dependencies!["@fontsource/encode-sans-expanded"]).toBe("^5.0.9");
    expect(out.pkg.devDependencies).toEqual({ vitest: "^5.0.0" });
  });

  it("supports every optional role, and leaves the rest of package.json as it was, sorted", () => {
    const out = syncFontPackages(base(), FULL_TYPOGRAPHY, { unbounded: "5.3.0", unifrakturcook: "5.3.0" });
    expect(Object.keys(out.pkg.dependencies!)).toEqual([...Object.keys(out.pkg.dependencies!)].sort((a, b) => a.localeCompare(b)));
    expect(out.pkg.dependencies).toMatchObject({ "@fontsource-variable/unbounded": "^5.3.0", "@fontsource/unifrakturcook": "^5.3.0", next: "^16.0.0" });
    expect(out.pkg.devDependencies).toEqual({ "@fontsource/unbounded": "^5.3.0", vitest: "^5.0.0" });
    expect(out.pkg).toMatchObject({ name: "band", scripts: { dev: "next dev" } });
  });

  it("is idempotent", () => {
    const first = syncFontPackages(base(), FULL_TYPOGRAPHY, { unbounded: "5.3.0", unifrakturcook: "5.3.0" });
    const second = syncFontPackages(clone(first.pkg), FULL_TYPOGRAPHY, {});
    expect(second.changed).toBe(false);
    expect(second.pkg).toEqual(first.pkg);
  });

  it("refuses to guess a version it was not given", () => {
    expect(() => syncFontPackages(base(), FULL_TYPOGRAPHY, {})).toThrow(/No version is known for @fontsource-variable\/unbounded/);
  });
});

describe("fontFileProblems", () => {
  it("is empty for the faces this repo has installed, including the files the icons are drawn from", () => {
    expect(fontFileProblems(root, DEFAULT_TYPOGRAPHY)).toEqual([]);
  });

  it("names a package that is not installed", () => {
    const typography = { ...DEFAULT_TYPOGRAPHY, kicker: { id: "not-installed-font", family: "Not Installed", category: "serif" as const, variable: false, weights: [400] } };
    expect(fontFileProblems(root, typography)).toEqual(["@fontsource/not-installed-font/400.css is not installed; run pnpm install"]);
  });

  it("catches a family name that does not match what the package declares", () => {
    const typography = { ...DEFAULT_TYPOGRAPHY, display: { ...DEFAULT_TYPOGRAPHY.display, family: "Encode Sans Wide" } };
    expect(fontFileProblems(root, typography)).toEqual(['encode-sans-expanded declares a different family than "Encode Sans Wide"; the CSS stack would not find it']);
  });

  it("says when the static files the icons are drawn from are missing because only the variable package is installed", () => {
    const typography = { ...DEFAULT_TYPOGRAPHY, display: { ...DEFAULT_TYPOGRAPHY.body } };
    const out = fontFileProblems(root, typography);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("drawn from @fontsource/space-grotesk");
  });
});
