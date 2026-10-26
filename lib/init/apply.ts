/**
 * Applies /init-band's answers to a repo. Everything is validated and rendered in memory first, so a bad answer or a
 * CLAUDE.md that lost a template marker fails before any file is touched; only then are the files written, and the
 * generated assets (theme, placeholder images, icons) rebuilt from the new config.
 *
 * `root` is the repo to change (tests point it at a temporary copy). `run` is how commands are executed, injectable for the same reason.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_TYPOGRAPHY, readTypography, type FontFace, type Typography } from "../theme/fonts";
import type { Adjustment } from "../theme/palette";
import { AnswersError, parseAnswers } from "./answers";
import { renderClaudeMd } from "./claude-md";
import { fontFileProblems, syncFontPackages, type PackageJson } from "./font-packages";
import { lookupFont, type FontInfo } from "./fonts";
import { renderReadme } from "./readme";
import { secretsChecklist, type SecretStep } from "./checklist";
import { resolveTypeAnswers } from "./type-answers";
import { activateExample, setPantheonSiteName } from "./workflows";

export type Runner = (command: string, args: string[], cwd: string) => void;

export type ApplyOptions = {
  root: string;
  answers: unknown;
  /** Re-run on a repo that has already been set up. */
  force?: boolean;
  /** Skip regenerating the theme, placeholder images and icons (they need Playwright). */
  skipAssets?: boolean;
  /** ISO date recorded in CLAUDE.md. */
  today?: string;
  run?: Runner;
  /** How a font name is looked up in Fontsource, injectable so tests never use the network. */
  lookup?: (name: string) => Promise<FontInfo>;
  /** What is wrong with the installed font files once `pnpm install` has run (empty when nothing). */
  verifyFonts?: (root: string, typography: Typography) => string[];
};

export type ApplyReport = {
  written: string[];
  adjustments: Adjustment[];
  installed: { deployedSite: boolean; registrySync: boolean };
  secrets: SecretStep[];
  /** Things left for the person, in plain words. */
  notes: string[];
};

const defaultRun: Runner = (command, args, cwd) => {
  const r = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${r.status}`);
};

/** A package.json name from the Pantheon site or the band name: lowercase letters, digits and hyphens. */
const packageName = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50).replace(/-+$/, "") || "band-site";

/** The config as JSON, with each font's weights on one line (a column of nine numbers helps nobody). */
const configJson = (config: unknown) => `${JSON.stringify(config, null, 2).replace(/("weights": )\[\s*([\d,\s]*?)\s*\]/g, (_, key: string, nums: string) => `${key}[${nums.split(",").map((n) => n.trim()).join(", ")}]`)}\n`;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const sitePackage = (face: FontFace) => `${face.variable ? "@fontsource-variable" : "@fontsource"}/${face.id}`;

const exists = (p: string) => fs.access(p).then(() => true, () => false);
const read = (root: string, rel: string) => fs.readFile(path.join(root, rel), "utf8");

export async function applyInit(opts: ApplyOptions): Promise<ApplyReport> {
  const { root } = opts;
  const run = opts.run ?? defaultRun;
  const configPath = path.join(root, "band.config.json");
  if ((await exists(configPath)) && !opts.force) {
    let existing: { setup?: { initialized?: boolean } };
    try {
      existing = JSON.parse(await fs.readFile(configPath, "utf8"));
    } catch (e) {
      throw new Error(`band.config.json is not valid JSON (${e instanceof Error ? e.message : e}); fix it or pass force to overwrite it.`);
    }
    if (existing.setup?.initialized === true) throw new Error("This repo has already been set up (setup.initialized is true). Pass force to run it again.");
  }

  // The type answers are font names: look them up (and note which package versions to install) before parsing the rest, so one
  // run reports every problem, the type ones included, and nothing has been written yet.
  const rawAnswers = isObject(opts.answers) ? opts.answers : {};
  const pkgPath = path.join(root, "package.json");
  const pkg = (await exists(pkgPath)) ? (JSON.parse(await fs.readFile(pkgPath, "utf8")) as PackageJson) : undefined;
  const have = new Set([...Object.keys(pkg?.dependencies ?? {}), ...Object.keys(pkg?.devDependencies ?? {})]);
  let current = DEFAULT_TYPOGRAPHY;
  try {
    current = readTypography(JSON.parse(await fs.readFile(configPath, "utf8")).typography, []);
  } catch {
    // No config, or one that is not readable: start from the template's faces.
  }
  const problems: string[] = [];
  let resolved = { typography: current, versions: {} as Record<string, string> };
  try {
    resolved = await resolveTypeAnswers(rawAnswers.type, current, (face) => have.has(sitePackage(face)), opts.lookup ?? lookupFont);
  } catch (e) {
    if (!(e instanceof AnswersError)) throw e;
    problems.push(...e.problems);
  }
  let parsed: ReturnType<typeof parseAnswers> | undefined;
  try {
    parsed = parseAnswers({ ...rawAnswers, type: resolved.typography });
  } catch (e) {
    if (!(e instanceof AnswersError)) throw e;
    problems.push(...e.problems);
  }
  if (problems.length || !parsed) throw new AnswersError(problems);
  const { answers, config, adjustments } = parsed;

  const site = answers.hosting?.pantheonSite;
  const installed = { deployedSite: Boolean(site), registrySync: Boolean(answers.hosting?.p1SiteId) };
  const offLimits = answers.identity.offLimits ?? [];
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  // Render everything before writing anything.
  const files = new Map<string, string>();
  files.set("band.config.json", configJson(config));
  files.set(
    "docs/off-limits.md",
    offLimits.length
      ? `# Off limits\n\nPublic copy, metadata, alt text, comments and docs must never state or hint at any of these. This file is gitignored: keep it that way.\n\n${offLimits.map((t) => `- ${t}`).join("\n")}\n`
      : "# Off limits\n\nNothing recorded yet. List topics here, one per line; this file is gitignored and the reviewer checks every commit against it.\n",
  );
  const notes: string[] = [];
  const claudeMd = await read(root, "CLAUDE.md");
  if (/<!-- template:/.test(claudeMd) || !opts.force) {
    files.set("CLAUDE.md", renderClaudeMd(claudeMd, { answers, date: today, adjustments, offLimitsCount: offLimits.length, installed }));
  } else {
    // A forced re-run on a repo whose CLAUDE.md was already rewritten: the markers are gone, so leave it alone rather than guess.
    notes.push("CLAUDE.md was already rewritten for a band, so it was left as it is. Update its Setup decisions section by hand to match the new answers.");
  }
  files.set("README.md", renderReadme(answers));

  const home = "content/p1-pages/home.json";
  if (await exists(path.join(root, home))) {
    type Block = { type: string; props: Record<string, unknown> & { actions?: { href?: string }[] } };
    const doc = JSON.parse(await read(root, home)) as { root?: { props?: Record<string, unknown> }; content?: Block[] };
    doc.root = { ...doc.root, props: { ...doc.root?.props, title: answers.identity.name, description: answers.identity.description } };
    if (!answers.features.tour) {
      // The fixture is the home page as designed and must say what the code version says (e2e compares them), so it drops
      // the tour list and the hero's Tour dates button when that section is off, as the code version does.
      doc.content = (doc.content ?? [])
        .filter((b) => b.type !== "TourPreviewBlock")
        .map((b) => (b.type === "HeroBlock" ? { ...b, props: { ...b.props, actions: (b.props.actions ?? []).filter((a) => a.href !== "/tour") } } : b));
    }
    files.set(home, `${JSON.stringify(doc, null, 2)}\n`);
  }

  if (answers.audio?.baseUrl && (await exists(path.join(root, ".env.example")))) {
    const env = await read(root, ".env.example");
    if (!/^NEXT_PUBLIC_AUDIO_BASE_URL=.*$/m.test(env)) throw new Error(".env.example has no NEXT_PUBLIC_AUDIO_BASE_URL line to update");
    files.set(".env.example", env.replace(/^NEXT_PUBLIC_AUDIO_BASE_URL=.*$/m, () => `NEXT_PUBLIC_AUDIO_BASE_URL=${answers.audio?.baseUrl}`));
  }

  if (site) {
    files.set(".github/workflows/promote-pantheon.yml", setPantheonSiteName(await read(root, ".github/workflows/promote-pantheon.yml"), site));
    files.set(".github/workflows/test-deployed-site.yml", setPantheonSiteName(activateExample(await read(root, "examples/workflows/test-deployed-site.yml")), site));
  }
  if (installed.registrySync) {
    files.set(".github/workflows/sync-puck-registry.yml", activateExample(await read(root, "examples/workflows/sync-puck-registry.yml")));
  }

  // package.json: the template's own name and description would otherwise ship in every band's repo, and its Fontsource packages
  // follow the faces chosen.
  let fontsChanged = false;
  if (pkg) {
    const synced = syncFontPackages(pkg, answers.type, resolved.versions);
    fontsChanged = synced.changed;
    const next: PackageJson = { ...synced.pkg, name: packageName(site ?? answers.identity.name), description: answers.identity.tagline };
    files.set("package.json", `${JSON.stringify(next, null, 2)}\n`);
  }

  // CODEOWNERS names the template's author; point it at the repo's own owner when we know it.
  const owner = answers.github?.owner;
  const codeowners = ".github/CODEOWNERS";
  if (owner && (await exists(path.join(root, codeowners)))) {
    // Every owner handle on every non-comment line, so a line that lists several ends up naming the one owner.
    files.set(
      codeowners,
      (await read(root, codeowners)).replace(/^(?!\s*#).*$/gm, (line) => line.replace(/(?<=\s)@[A-Za-z0-9-]+(?:\/[A-Za-z0-9._-]+)?(?=\s|$)/g, `@${owner}`)),
    );
  }

  // docs/ must stay out of git: the off-limits list would give its topics away.
  const gitignorePath = path.join(root, ".gitignore");
  const gitignore = (await exists(gitignorePath)) ? await fs.readFile(gitignorePath, "utf8") : "";
  if (!/^\/docs\/\s*$/m.test(gitignore)) files.set(".gitignore", `${gitignore.replace(/\n*$/, "\n")}/docs/\n`);

  for (const [rel, text] of files) {
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await fs.writeFile(path.join(root, rel), text);
  }

  if (!opts.skipAssets) {
    if (fontsChanged) {
      run("pnpm", ["install"], root);
      const missing = (opts.verifyFonts ?? fontFileProblems)(root, answers.type);
      if (missing.length) {
        throw new Error(`band.config.json and package.json are written, but the fonts are not usable:\n- ${missing.join("\n- ")}\nFix that, then run: pnpm install && pnpm theme`);
      }
    }
    // The theme first: it also writes the font imports, and the placeholder images and the icons read the generated colours.
    run("pnpm", ["exec", "tsx", "scripts/generate-theme.ts"], root);
    run("node", ["scripts/make-placeholder-images.mjs"], root);
    run("node", ["scripts/make-brand-assets.mjs"], root);
  }

  if (fontsChanged && opts.skipAssets) notes.push("package.json now names the chosen typefaces: run `pnpm install`, then `pnpm theme` (it writes the font imports), and commit pnpm-lock.yaml with the rest.");
  if (fontsChanged && !opts.skipAssets) notes.push("pnpm-lock.yaml changed with the typefaces: commit it with the rest.");
  if (answers.customFonts?.length) {
    const list = answers.customFonts.map((c) => `${c.name} (${c.role})`).join(", ");
    notes.push(`Custom typefaces still to add: ${list}. The config uses a Fontsource stand-in for each until then. Once this setup is merged, adding the real one is a design PR after setup (a design-fonts-<name> branch from a freshly pulled main, per the design approval workflow): have the font files and a licence that allows web embedding ready.`);
  }
  if (!site) notes.push("No Pantheon site recorded: the promote and deployed-site workflows still use the placeholder name, and no secrets can be listed yet. Create the site, then re-run the hosting questions.");
  if (!answers.hosting?.p1SiteId) notes.push("No P1 site id recorded: the registry sync is not installed. Create the P1 site, then re-run the hosting questions.");
  if (!owner) notes.push("No GitHub owner recorded: .github/CODEOWNERS still names the template's author. Edit it, or re-run with github.owner set.");
  if (!answers.audio?.baseUrl) notes.push("No audio host recorded: set NEXT_PUBLIC_AUDIO_BASE_URL (and the R2 secrets) when the bucket exists.");
  notes.push("The albums, shows, merch, lyrics, bio and press article are still the template's samples. Replace them (CONTENT.md says where); the tests and e2e checks that mention those samples need updating with them.");

  return { written: [...files.keys()], adjustments, installed, secrets: secretsChecklist(answers), notes };
}
