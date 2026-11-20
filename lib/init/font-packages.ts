/**
 * Keeps package.json and node_modules in step with the typefaces band.config.json names. `apply` calls syncFontPackages to
 * work out the Fontsource dependencies (and drop the ones no longer used), runs `pnpm install`, then fontFileProblems to prove
 * every file the site and the icons need is really there and declares the family the CSS stack names.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { assetFace, assetWeight, cssFamily, fontImports, fontPackages, type FontFace, type Typography } from "../theme/fonts";

export type PackageJson = Record<string, unknown> & { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

const FONT_PACKAGE = /^@fontsource(?:-variable)?\//;
const idOf = (name: string) => name.replace(FONT_PACKAGE, "");
const sorted = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));

/**
 * package.json with exactly the Fontsource packages `typography` needs: the site's in dependencies, the one the icons are drawn from
 * in devDependencies when the site ships the variable file instead. A package already listed keeps its version; a new one gets
 * `^<version>` from `versions` (by Fontsource id). Everything else in the file is left as it was.
 */
export function syncFontPackages(pkg: PackageJson, typography: Typography, versions: Record<string, string>): { pkg: PackageJson; changed: boolean } {
  const need = fontPackages(typography);
  const deps = { ...pkg.dependencies };
  const dev = { ...pkg.devDependencies };
  const specOf = (name: string) => {
    const spec = deps[name] ?? dev[name] ?? (versions[idOf(name)] ? `^${versions[idOf(name)]}` : undefined);
    if (!spec) throw new Error(`No version is known for ${name}: it is not in package.json and the font was not looked up. Is package.json out of step with band.config.json?`);
    return spec;
  };
  const keep = Object.fromEntries([...need.dependencies, ...need.devDependencies].map((name) => [name, specOf(name)]));

  for (const m of [deps, dev]) for (const name of Object.keys(m)) if (FONT_PACKAGE.test(name)) delete m[name];
  for (const name of need.dependencies) deps[name] = keep[name];
  for (const name of need.devDependencies) dev[name] = keep[name];

  const next: PackageJson = { ...pkg, dependencies: sorted(deps) };
  if (pkg.devDependencies || Object.keys(dev).length) next.devDependencies = sorted(dev);
  return { pkg: next, changed: JSON.stringify([pkg.dependencies, pkg.devDependencies]) !== JSON.stringify([next.dependencies, next.devDependencies]) };
}

const FILE_CHECKED = (face: FontFace) => (face.variable ? "index.css" : `${face.weights[0]}.css`);

/** What is wrong with the installed font files, empty when every file the site and the icons need is there. */
export function fontFileProblems(root: string, typography: Typography): string[] {
  const problems: string[] = [];
  const modules = path.join(root, "node_modules");

  for (const spec of fontImports(typography)) {
    if (!existsSync(path.join(modules, spec.endsWith(".css") ? spec : `${spec}/index.css`))) problems.push(`${spec} is not installed; run pnpm install`);
  }

  for (const face of [typography.display, typography.body, typography.wordmark, typography.kicker]) {
    if (!face) continue;
    const css = path.join(modules, face.variable ? "@fontsource-variable" : "@fontsource", face.id, FILE_CHECKED(face));
    if (existsSync(css) && !readFileSync(css, "utf-8").includes(`font-family: '${cssFamily(face)}'`)) {
      problems.push(`${face.id} declares a different family than "${cssFamily(face)}"; the CSS stack would not find it`);
    }
  }

  // The icons and the social card are drawn from the static files, which a variable-only choice does not otherwise install.
  const asset = assetFace(typography);
  const weight = assetWeight(typography);
  for (const ext of ["woff2", "woff"]) {
    const file = path.join(modules, "@fontsource", asset.id, "files", `${asset.id}-latin-${weight}-normal.${ext}`);
    if (!existsSync(file)) problems.push(`the icons and social card are drawn from @fontsource/${asset.id} (weight ${weight}), which is not installed; run pnpm install`);
  }
  return [...new Set(problems)];
}
