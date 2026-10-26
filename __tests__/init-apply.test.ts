import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { afterEach, describe, expect, it } from "vitest";

import { applyInit } from "../lib/init/apply";
import { syncFontPackages } from "../lib/init/font-packages";
import { suggestPalette } from "../lib/init/palette-suggest";
import { DEFAULT_TYPOGRAPHY } from "../lib/theme/fonts";
import { FULL_TYPE_ANSWER, makeLookup } from "./fixtures/typography";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The files the init flow reads or rewrites. Each is reset to its template state in the copy, so these tests keep passing once the repo itself has been configured.
const FILES = ["band.config.json", "README.md", ".gitignore", ".env.example", "content/p1-pages/home.json", "package.json", ".github/workflows/promote-pantheon.yml", "examples/workflows/test-deployed-site.yml", "examples/workflows/sync-puck-registry.yml"];

const text = (root: string, rel: string) => readFileSync(join(root, rel), "utf-8");
const dirs: string[] = [];
function tempRepo() {
  const root = mkdtempSync(join(tmpdir(), "init-band-"));
  dirs.push(root);
  for (const f of FILES) {
    mkdirSync(dirname(join(root, f)), { recursive: true });
    cpSync(join(repo, f), join(root, f));
  }
  cpSync(join(repo, "__tests__/fixtures/claude-template.md"), join(root, "CLAUDE.md"));
  const config = JSON.parse(text(root, "band.config.json"));
  config.setup = { initialized: false };
  delete config.hosting;
  writeFileSync(join(root, "band.config.json"), JSON.stringify(config, null, 2));
  // A stand-in CODEOWNERS (the real one names whoever owns this repo now), and the package name reset to the template's.
  mkdirSync(join(root, ".github"), { recursive: true });
  writeFileSync(join(root, ".github/CODEOWNERS"), "# Design changes are approved by the repo owner.\n/.storybook/ @template-author\n/design-system/ @template-author\n/.github/ @template-author @second-owner\n");
  const pkg = JSON.parse(text(root, "package.json"));
  pkg.name = "band-site-template";
  // The template ships with exactly the Fontsource packages its default faces need, whatever this repo has chosen since.
  writeFileSync(join(root, "package.json"), JSON.stringify(syncFontPackages(pkg, DEFAULT_TYPOGRAPHY, {}).pkg, null, 2));
  const promote = ".github/workflows/promote-pantheon.yml";
  writeFileSync(join(root, promote), text(root, promote).replace(/^(\s*PANTHEON_SITE_NAME:\s*).*$/m, "$1your-site-name"));
  return root;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const answers = (extra: Record<string, unknown> = {}) => ({
  identity: {
    name: "Neon Orchard",
    tagline: "Slow synths for fast nights.",
    description: "Neon Orchard is a three-piece making slow synth music for fast nights.",
    genre: "Synthpop",
    fictional: true,
    siteUrl: "https://neon-orchard.example.com",
    offLimits: ["a-very-specific-forbidden-topic"],
  },
  look: { palette: suggestPalette({ hue: 150, loudness: "balanced", scheme: "triad" }) },
  type: FULL_TYPE_ANSWER,
  features: { tour: true, merch: false, lyrics: true, map: true, press: false },
  audio: { baseUrl: "https://audio.neon-orchard.example.com" },
  hosting: { pantheonSite: "neon-orchard", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" },
  github: { owner: "neon-owner" },
  ...extra,
});

const { lookup, calls: lookups } = makeLookup();
const calls: string[][] = [];
const run = (command: string, args: string[]) => void calls.push([command, ...args]);
// Nothing is installed in a temporary copy, so the check of the installed files is replaced by one that finds nothing wrong.
const verifyFonts = () => [];
const apply = (o: Parameters<typeof applyInit>[0]) => applyInit({ lookup, verifyFonts, ...o });
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

describe("applyInit", () => {
  it("writes the config, the off-limits notes, the docs and the workflows for a fully specified band", async () => {
    const root = tempRepo();
    const report = await apply({ root, answers: answers(), today: "2026-10-23", run, skipAssets: true });

    const config = JSON.parse(text(root, "band.config.json"));
    expect(config).toMatchObject({ band: { name: "Neon Orchard", fictional: true }, setup: { initialized: true }, hosting: { pantheonSite: "neon-orchard" }, features: { merch: false, press: false } });
    expect(text(root, "docs/off-limits.md")).toContain("- a-very-specific-forbidden-topic");
    expect(text(root, ".gitignore")).toMatch(/^\/docs\/$/m);

    expect(text(root, "CLAUDE.md")).toContain("Neon Orchard (a fictional act)");
    expect(text(root, "CLAUDE.md")).not.toContain("template:");
    expect(text(root, "README.md").startsWith("# Neon Orchard")).toBe(true);
    const home = JSON.parse(text(root, "content/p1-pages/home.json"));
    expect(home.root.props).toMatchObject({ title: "Neon Orchard", description: expect.stringContaining("three-piece") });
    expect(text(root, ".env.example")).toContain("NEXT_PUBLIC_AUDIO_BASE_URL=https://audio.neon-orchard.example.com");

    expect(text(root, ".github/workflows/promote-pantheon.yml")).toContain("PANTHEON_SITE_NAME: neon-orchard");
    expect(text(root, ".github/workflows/test-deployed-site.yml")).toContain("PANTHEON_SITE_NAME: neon-orchard");
    expect(text(root, ".github/workflows/test-deployed-site.yml")).not.toContain("EXAMPLE, NOT ACTIVE");
    expect(text(root, ".github/workflows/sync-puck-registry.yml")).toContain("# Installed from examples/workflows/ by /init-band.");
    expect(report.installed).toEqual({ deployedSite: true, registrySync: true });
    expect(report.secrets.length).toBeGreaterThan(5);
    expect(report.written).toContain("band.config.json");
  });

  it("drops the tour list and the hero's Tour dates button from the home fixture when the tour is off, and keeps them when it is on", async () => {
    const on = tempRepo();
    await apply({ root: on, answers: answers(), run, skipAssets: true });
    const onHome = JSON.parse(text(on, "content/p1-pages/home.json"));
    expect(onHome.content.map((b: { type: string }) => b.type)).toContain("TourPreviewBlock");
    expect(onHome.content[0].props.actions.map((a: { href: string }) => a.href)).toContain("/tour");

    const off = tempRepo();
    const a = answers() as Record<string, any>;
    a.features = { tour: false, merch: true, lyrics: true, map: false, press: true };
    await apply({ root: off, answers: a, run, skipAssets: true });
    const offHome = JSON.parse(text(off, "content/p1-pages/home.json"));
    expect(offHome.content.map((b: { type: string }) => b.type)).not.toContain("TourPreviewBlock");
    expect(offHome.content[0].props.actions.map((x: { href: string }) => x.href)).toEqual(["/listen"]);
  });

  it("renames the package and describes it as the band, so the template's name does not ship in every repo", async () => {
    const root = tempRepo();
    await apply({ root, answers: answers(), run, skipAssets: true });
    expect(JSON.parse(text(root, "package.json"))).toMatchObject({ name: "neon-orchard", description: "Slow synths for fast nights." });
    const noSite = tempRepo();
    const a = answers({ hosting: undefined }) as Record<string, any>;
    a.identity.name = "Cinder & Vale";
    await apply({ root: noSite, answers: a, run, skipAssets: true });
    expect(JSON.parse(text(noSite, "package.json")).name).toBe("cinder-vale");
  });

  it("points CODEOWNERS at the repo's owner, leaving comments alone, and says so when it does not know the owner", async () => {
    const root = tempRepo();
    await apply({ root, answers: answers(), run, skipAssets: true });
    const owners = text(root, ".github/CODEOWNERS");
    expect(owners).toContain("/design-system/ @neon-owner");
    expect(owners).toContain("/.github/ @neon-owner @neon-owner");
    expect(owners).not.toContain("@template-author");
    expect(owners.split("\n")[0]).toBe("# Design changes are approved by the repo owner.");

    const unknown = tempRepo();
    const report = await apply({ root: unknown, answers: answers({ github: undefined }), run, skipAssets: true });
    expect(text(unknown, ".github/CODEOWNERS")).toContain("@template-author");
    expect(report.notes.join("\n")).toMatch(/No GitHub owner recorded/);
  });

  it("keeps the off-limits topics out of every file except docs/off-limits.md", async () => {
    const root = tempRepo();
    await apply({ root, answers: answers(), run, skipAssets: true });
    const holders = walk(root).filter((f) => readFileSync(f, "utf-8").includes("a-very-specific-forbidden-topic"));
    expect(holders).toEqual([join(root, "docs/off-limits.md")]);
  });

  it("installs the font packages first when the typefaces changed, then regenerates the theme, the images and the icons that read it, unless told to skip", async () => {
    calls.length = 0;
    const root = tempRepo();
    await apply({ root, answers: answers(), run });
    expect(calls).toEqual([
      ["pnpm", "install"],
      ["pnpm", "exec", "tsx", "scripts/generate-theme.ts"],
      ["node", "scripts/make-placeholder-images.mjs"],
      ["node", "scripts/make-brand-assets.mjs"],
    ]);
    calls.length = 0;
    await apply({ root: tempRepo(), answers: answers(), run, skipAssets: true });
    expect(calls).toEqual([]);
  });

  it("does not install anything, or look a font up, when the typefaces are the ones the repo already has", async () => {
    calls.length = 0;
    lookups.length = 0;
    const a = answers() as Record<string, any>;
    delete a.type;
    const report = await apply({ root: tempRepo(), answers: a, run });
    expect(calls.map((c) => c.join(" "))).toEqual(["pnpm exec tsx scripts/generate-theme.ts", "node scripts/make-placeholder-images.mjs", "node scripts/make-brand-assets.mjs"]);
    expect(lookups).toEqual([]);
    expect(report.notes.join("\n")).not.toMatch(/pnpm-lock/);
  });

  it("records the chosen typefaces in band.config.json and names their packages in package.json, dropping the ones no longer used", async () => {
    const root = tempRepo();
    const a = answers({ type: { display: "Playfair Display", body: "Space Grotesk", wordmark: { font: "Bebas Neue", uppercase: false }, kicker: null } }) as Record<string, any>;
    // A package left over from an earlier choice, which the new faces do not use.
    const stale = JSON.parse(text(root, "package.json"));
    stale.dependencies["@fontsource/unifrakturcook"] = "^5.3.0";
    writeFileSync(join(root, "package.json"), JSON.stringify(stale, null, 2));
    expect(JSON.parse(text(root, "package.json")).dependencies).toHaveProperty(["@fontsource/unifrakturcook"]);
    const report = await apply({ root, answers: a, run, skipAssets: true });
    const config = JSON.parse(text(root, "band.config.json"));
    expect(config.typography.display).toMatchObject({ id: "playfair-display", variable: true });
    expect(config.typography.wordmark).toMatchObject({ id: "bebas-neue", uppercase: false, weights: [400] });
    expect(config.typography.kicker).toBeNull();
    expect(text(root, "band.config.json")).toMatch(/"weights": \[400, 500, 600, 700, 800, 900\]/);

    const pkg = JSON.parse(text(root, "package.json"));
    expect(pkg.dependencies).toMatchObject({ "@fontsource-variable/playfair-display": "^5.3.0", "@fontsource-variable/space-grotesk": expect.any(String), "@fontsource/bebas-neue": "^5.3.0" });
    expect(pkg.dependencies).not.toHaveProperty(["@fontsource/encode-sans-expanded"]);
    expect(pkg.dependencies).not.toHaveProperty(["@fontsource/unifrakturcook"]);
    expect(text(root, "CLAUDE.md")).toContain("headings in Playfair Display (variable), body in Space Grotesk (variable); the wordmark in Bebas Neue");
    expect(report.notes.join("\n")).toContain("run `pnpm install`, then `pnpm theme`");
  });

  it("says at the end that a design PR is owed for each custom typeface, and nothing when there are none", async () => {
    const none = await apply({ root: tempRepo(), answers: answers(), run, skipAssets: true });
    expect(none.notes.join("\n")).not.toMatch(/Custom typefaces/);
    const root = tempRepo();
    const report = await apply({ root, answers: answers({ customFonts: [{ role: "display", name: "Acme Grotesk" }] }), run, skipAssets: true });
    const note = report.notes.find((n) => n.startsWith("Custom typefaces still to add"));
    expect(note).toContain("Acme Grotesk (display)");
    expect(note).toContain("Fontsource stand-in");
    expect(note).toContain("design PR after setup");
    expect(text(root, "CLAUDE.md")).toContain("**Custom typefaces still to add:** Acme Grotesk (display).");
    expect(JSON.stringify(JSON.parse(text(root, "band.config.json")))).not.toContain("Acme Grotesk");
  });

  it("stops after writing, saying what is wrong, when the installed fonts are not usable", async () => {
    const root = tempRepo();
    await expect(apply({ root, answers: answers(), run, verifyFonts: () => ["@fontsource/bebas-neue/400.css is not installed; run pnpm install"] })).rejects.toThrow(/fonts are not usable:\n- @fontsource\/bebas-neue\/400\.css is not installed[\s\S]*pnpm install && pnpm theme/);
    // The message says both files are written, so they must be.
    expect(JSON.parse(text(root, "band.config.json"))).toMatchObject({ setup: { initialized: true }, typography: { wordmark: { id: "unbounded" } } });
    expect(JSON.parse(text(root, "package.json")).dependencies).toHaveProperty(["@fontsource-variable/unbounded"]);
  });

  it("installs only what it has the facts for, and says what is left", async () => {
    const root = tempRepo();
    const report = await apply({ root, answers: answers({ hosting: undefined, audio: undefined }), run, skipAssets: true });
    expect(existsSync(join(root, ".github/workflows/test-deployed-site.yml"))).toBe(false);
    expect(existsSync(join(root, ".github/workflows/sync-puck-registry.yml"))).toBe(false);
    expect(text(root, ".github/workflows/promote-pantheon.yml")).toContain("your-site-name");
    expect(report.installed).toEqual({ deployedSite: false, registrySync: false });
    expect(report.notes.join("\n")).toMatch(/No Pantheon site recorded/);
    expect(report.notes.join("\n")).toMatch(/No P1 site id recorded/);
    expect(report.notes.join("\n")).toMatch(/No audio host recorded/);
    expect(report.secrets).toEqual([]);
  });

  it("changes nothing when an answer is invalid, and names the type problems with the others", async () => {
    const root = tempRepo();
    const before = text(root, "band.config.json");
    const beforePackage = text(root, "package.json");
    const bad = answers({ type: { display: "Acme Grotesk", body: 7 } }) as Record<string, any>;
    bad.identity.name = "";
    const e = await apply({ root, answers: bad, run, skipAssets: true }).catch((x) => x);
    expect(e.message).toContain('type.display: Fontsource has no font "acme-grotesk"');
    expect(e.message).toContain("type.body must be a font name");
    expect(e.message).toContain("identity.name must be a non-empty string");
    expect(text(root, "band.config.json")).toBe(before);
    expect(text(root, "package.json")).toBe(beforePackage);
    expect(existsSync(join(root, "docs"))).toBe(false);
  });

  it("changes nothing when CLAUDE.md has lost a template block", async () => {
    const root = tempRepo();
    const broken = text(root, "CLAUDE.md").replace("<!-- template:placeholders:start -->", "");
    writeFileSync(join(root, "CLAUDE.md"), broken);
    await expect(apply({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/template:placeholders/);
    expect(JSON.parse(text(root, "band.config.json")).setup.initialized).toBe(false);
  });

  it("refuses to run twice unless forced", async () => {
    const root = tempRepo();
    await apply({ root, answers: answers(), run, skipAssets: true });
    await expect(apply({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/already been set up/);
  });

  it("a forced re-run on a configured repo updates the config but leaves the already-rewritten CLAUDE.md alone, and says so", async () => {
    const root = tempRepo();
    await apply({ root, answers: answers(), today: "2026-10-23", run, skipAssets: true });
    const rewritten = text(root, "CLAUDE.md");
    const renamed = answers() as Record<string, any>;
    renamed.identity.name = "Orchard Neon";
    const report = await apply({ root, answers: renamed, force: true, run, skipAssets: true });
    expect(JSON.parse(text(root, "band.config.json")).band.name).toBe("Orchard Neon");
    expect(text(root, "CLAUDE.md")).toBe(rewritten);
    expect(report.notes.join("\n")).toMatch(/CLAUDE\.md was already rewritten/);
  });

  it("does not guess when a CLAUDE.md without markers meets an un-forced run", async () => {
    const root = tempRepo();
    writeFileSync(join(root, "CLAUDE.md"), "# CLAUDE.md\n\nAlready a band's file.\n");
    await expect(apply({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/template:intro/);
  });

  it("explains a malformed band.config.json instead of throwing a bare parse error", async () => {
    const root = tempRepo();
    writeFileSync(join(root, "band.config.json"), "{ not json");
    await expect(apply({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/band\.config\.json is not valid JSON/);
  });

  it("leaves .gitignore alone when docs/ is already ignored, and appends it when it is not", async () => {
    const withIt = tempRepo();
    const before = text(withIt, ".gitignore");
    expect(before).toMatch(/^\/docs\/$/m);
    await apply({ root: withIt, answers: answers(), run, skipAssets: true });
    expect(text(withIt, ".gitignore")).toBe(before);
    const without = tempRepo();
    writeFileSync(join(without, ".gitignore"), "node_modules\n");
    await apply({ root: without, answers: answers(), run, skipAssets: true });
    expect(text(without, ".gitignore")).toBe("node_modules\n/docs/\n");
  });
});
