/**
 * Generates design-system/theme.generated.css (colours and font stacks) and design-system/fonts.ts (the font files to
 * load) from band.config.json.
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
import { renderFontsModule } from "../lib/theme/fonts";
import { PaletteError, renderThemeCss, resolvePalette, validatePalette } from "../lib/theme/palette";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Each generated file and what it should contain.
const targets = (css: string) => [
  { file: "design-system/theme.generated.css", text: css },
  { file: "design-system/fonts.ts", text: renderFontsModule(typography) },
];

try {
  const config = JSON.parse(readFileSync(path.join(root, "band.config.json"), "utf-8")) as { palette?: unknown };
  const { palette, adjustments } = resolvePalette(validatePalette(config.palette));
  for (const a of adjustments) console.warn(`adjusted ${a.key}: ${a.from} -> ${a.to} (${a.reason})`);
  const outputs = targets(renderThemeCss(palette, typography));

  if (process.argv.includes("--check")) {
    const stale = outputs.filter(({ file, text }) => {
      try {
        return readFileSync(path.join(root, file), "utf-8") !== text;
      } catch {
        return true; // A missing file is stale too.
      }
    });
    if (stale.length) {
      console.error(`Out of date with band.config.json: ${stale.map((o) => o.file).join(", ")}. Run \`pnpm theme\`.`);
      process.exit(1);
    }
  } else {
    for (const { file, text } of outputs) writeFileSync(path.join(root, file), text);
    console.log(`wrote ${outputs.map((o) => o.file).join(" and ")}${adjustments.length ? ` (${adjustments.length} colour(s) adjusted for contrast)` : ""}`);
  }
} catch (e) {
  console.error(e instanceof PaletteError || e instanceof BandConfigError ? e.message : e);
  process.exit(1);
}
