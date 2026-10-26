/**
 * The helper the /init-band skill drives. Usage: tsx scripts/init-band.ts <command>
 *
 *   status                                  is this repo still the placeholder band?
 *   suggest-palette --hue N [--loudness quiet|balanced|loud] [--scheme analogous|complement|triad|mono]
 *                                           print a proposed palette (JSON) and its contrast report
 *   check-palette <file.json>               gate a palette file; exit 1 if it is rejected
 *   font-info <name> [--role display|body|wordmark|kicker]
 *                                           look a font up in Fontsource: how it ships, its licence, where to see it, and notes for the role
 *   p1-pages [--bio <file.md>] [--json]
 *                                           the P1 pages for this band, built from its content (nothing is created: the skill sends them to P1)
 *   apply <answers.json> [--force] [--skip-assets]
 *                                           write the band's config, notes, docs, workflows and assets; print the secrets to set
 *
 * The answers file is the person's answers, so keep it out of git (docs/ is ignored). Nothing here ever receives a secret.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LOUDNESS, SCHEMES, suggestPalette, type Loudness, type Scheme } from "../lib/init/palette-suggest";
import { applyInit } from "../lib/init/apply";
import { AnswersError } from "../lib/init/answers";
import { paletteReport } from "../lib/init/palette-report";
import { describeFont, FontLookupError, lookupFont } from "../lib/init/fonts";
import { buildP1Pages, describeP1Pages, p1PagesProblem, readRepoContent } from "../lib/init/p1-pages";
import { formatChecklist } from "../lib/init/checklist";
import { band, hosting, setup } from "../lib/band/config";
import { FONT_ROLES, type FontRole } from "../lib/theme/fonts";
import { validatePalette } from "../lib/theme/palette";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...rest] = process.argv.slice(2);

const flag = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const has = (name: string) => rest.includes(`--${name}`);
const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};
const readJson = (file: string | undefined) => {
  if (!file) return fail("Give the path of a JSON file.");
  try {
    return JSON.parse(readFileSync(path.resolve(file), "utf-8"));
  } catch (e) {
    return fail(`Could not read ${file}: ${e instanceof Error ? e.message : e}`);
  }
};

async function main() {
  switch (command) {
    case "status":
      console.log(JSON.stringify({ initialized: setup.initialized, name: band.name }));
      return;
    case "suggest-palette": {
      const hue = Number(flag("hue"));
      const loudness = (flag("loudness") ?? "balanced") as Loudness;
      const scheme = (flag("scheme") ?? "analogous") as Scheme;
      if (!Number.isFinite(hue)) fail("--hue is required, in degrees (0 red, 90 yellow-green, 150 green, 210 blue, 280 purple, 340 pink).");
      if (!LOUDNESS.includes(loudness)) fail(`--loudness must be one of ${LOUDNESS.join(", ")}`);
      if (!SCHEMES.includes(scheme)) fail(`--scheme must be one of ${SCHEMES.join(", ")}`);
      const palette = suggestPalette({ hue, loudness, scheme });
      console.log(JSON.stringify(palette, null, 2));
      console.error(`\n${paletteReport(palette).text}`);
      return;
    }
    case "check-palette": {
      const report = paletteReport(validatePalette(readJson(rest[0])));
      console.log(report.text);
      if (!report.ok) process.exit(1);
      return;
    }
    case "font-info": {
      const role = flag("role") as FontRole | undefined;
      if (!rest[0] || rest[0].startsWith("--")) fail("Give the font's name, such as: font-info \"Playfair Display\" --role display");
      if (role !== undefined && !FONT_ROLES.includes(role)) fail(`--role must be one of ${FONT_ROLES.join(", ")}`);
      try {
        console.log(describeFont(await lookupFont(rest[0]), role));
      } catch (e) {
        if (e instanceof FontLookupError) fail(e.message);
        throw e;
      }
      return;
    }
    case "p1-pages": {
      const problem = p1PagesProblem({ setup, hosting });
      if (problem) fail(problem);
      const bioFile = flag("bio");
      const pages = buildP1Pages(readRepoContent(root, bioFile ? readFileSync(path.resolve(bioFile), "utf-8") : undefined));
      console.log(has("json") ? JSON.stringify({ siteId: hosting.p1SiteId, pages }, null, 2) : describeP1Pages(hosting.p1SiteId as string, pages));
      return;
    }
    case "apply": {
      const report = await applyInit({ root, answers: readJson(rest[0]), force: has("force"), skipAssets: has("skip-assets") });
      console.log(`Wrote ${report.written.length} files:\n${report.written.map((f) => `  ${f}`).join("\n")}`);
      if (report.adjustments.length) console.log(`\nThe gate lifted: ${report.adjustments.map((a) => a.key).join(", ")} (hue kept).`);
      console.log(`\nWorkflows installed: ${[report.installed.deployedSite && "test-deployed-site", report.installed.registrySync && "sync-puck-registry"].filter(Boolean).join(", ") || "none"}`);
      console.log(`\n${formatChecklist(report.secrets)}`);
      if (report.notes.length) console.log(`\nStill to do:\n${report.notes.map((n) => `- ${n}`).join("\n")}`);
      return;
    }
    default:
      fail("Usage: tsx scripts/init-band.ts status | suggest-palette --hue N | check-palette <file> | font-info <name> | p1-pages [--bio <file>] [--json] | apply <answers.json> [--force] [--skip-assets]");
  }
}

main().catch((e) => fail(e instanceof AnswersError || e instanceof Error ? e.message : String(e)));
