/**
 * Generates design-system/theme.generated.css from band.config.json's palette.
 *
 * Usage: tsx scripts/generate-theme.ts [--check]
 *
 * A text colour that fails WCAG AA is lifted (same hue, more lightness) and reported; a palette that
 * cannot be repaired is rejected with the reason and nothing is written. --check writes nothing and
 * exits 1 if the committed file is stale, which is how CI catches an edit to the config without a regenerate.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BandConfigError, typography } from "../lib/band/config";
import { PaletteError, renderThemeCss, resolvePalette, validatePalette } from "../lib/theme/palette";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "design-system/theme.generated.css");

try {
  const config = JSON.parse(readFileSync(path.join(root, "band.config.json"), "utf-8")) as { palette?: unknown };
  const { palette, adjustments } = resolvePalette(validatePalette(config.palette));
  for (const a of adjustments) console.warn(`adjusted ${a.key}: ${a.from} -> ${a.to} (${a.reason})`);
  const css = renderThemeCss(palette, typography);

  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(target, "utf-8");
    } catch {
      // A missing file is stale too.
    }
    if (current !== css) {
      console.error("design-system/theme.generated.css is out of date with band.config.json. Run `pnpm theme`.");
      process.exit(1);
    }
  } else {
    writeFileSync(target, css);
    console.log(`wrote design-system/theme.generated.css${adjustments.length ? ` (${adjustments.length} colour(s) adjusted for contrast)` : ""}`);
  }
} catch (e) {
  console.error(e instanceof PaletteError || e instanceof BandConfigError ? e.message : e);
  process.exit(1);
}
