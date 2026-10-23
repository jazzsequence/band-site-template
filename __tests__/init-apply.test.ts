import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { afterEach, describe, expect, it } from "vitest";

import { applyInit } from "../lib/init/apply";
import { suggestPalette } from "../lib/init/palette-suggest";

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
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg, null, 2));
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
  type: { wordmarkFace: true, accentFace: false },
  features: { tour: true, merch: false, lyrics: true, map: true, press: false },
  audio: { baseUrl: "https://audio.neon-orchard.example.com" },
  hosting: { pantheonSite: "neon-orchard", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" },
  github: { owner: "neon-owner" },
  ...extra,
});

const calls: string[][] = [];
const run = (command: string, args: string[]) => void calls.push([command, ...args]);
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

describe("applyInit", () => {
  it("writes the config, the off-limits notes, the docs and the workflows for a fully specified band", async () => {
    const root = tempRepo();
    const report = await applyInit({ root, answers: answers(), today: "2026-10-23", run, skipAssets: true });

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
    await applyInit({ root: on, answers: answers(), run, skipAssets: true });
    const onHome = JSON.parse(text(on, "content/p1-pages/home.json"));
    expect(onHome.content.map((b: { type: string }) => b.type)).toContain("TourPreviewBlock");
    expect(onHome.content[0].props.actions.map((a: { href: string }) => a.href)).toContain("/tour");

    const off = tempRepo();
    const a = answers() as Record<string, any>;
    a.features = { tour: false, merch: true, lyrics: true, map: false, press: true };
    await applyInit({ root: off, answers: a, run, skipAssets: true });
    const offHome = JSON.parse(text(off, "content/p1-pages/home.json"));
    expect(offHome.content.map((b: { type: string }) => b.type)).not.toContain("TourPreviewBlock");
    expect(offHome.content[0].props.actions.map((x: { href: string }) => x.href)).toEqual(["/listen"]);
  });

  it("renames the package and describes it as the band, so the template's name does not ship in every repo", async () => {
    const root = tempRepo();
    await applyInit({ root, answers: answers(), run, skipAssets: true });
    expect(JSON.parse(text(root, "package.json"))).toMatchObject({ name: "neon-orchard", description: "Slow synths for fast nights." });
    const noSite = tempRepo();
    const a = answers({ hosting: undefined }) as Record<string, any>;
    a.identity.name = "Cinder & Vale";
    await applyInit({ root: noSite, answers: a, run, skipAssets: true });
    expect(JSON.parse(text(noSite, "package.json")).name).toBe("cinder-vale");
  });

  it("points CODEOWNERS at the repo's owner, leaving comments alone, and says so when it does not know the owner", async () => {
    const root = tempRepo();
    await applyInit({ root, answers: answers(), run, skipAssets: true });
    const owners = text(root, ".github/CODEOWNERS");
    expect(owners).toContain("/design-system/ @neon-owner");
    expect(owners).toContain("/.github/ @neon-owner @neon-owner");
    expect(owners).not.toContain("@template-author");
    expect(owners.split("\n")[0]).toBe("# Design changes are approved by the repo owner.");

    const unknown = tempRepo();
    const report = await applyInit({ root: unknown, answers: answers({ github: undefined }), run, skipAssets: true });
    expect(text(unknown, ".github/CODEOWNERS")).toContain("@template-author");
    expect(report.notes.join("\n")).toMatch(/No GitHub owner recorded/);
  });

  it("keeps the off-limits topics out of every file except docs/off-limits.md", async () => {
    const root = tempRepo();
    await applyInit({ root, answers: answers(), run, skipAssets: true });
    const holders = walk(root).filter((f) => readFileSync(f, "utf-8").includes("a-very-specific-forbidden-topic"));
    expect(holders).toEqual([join(root, "docs/off-limits.md")]);
  });

  it("regenerates the theme first, then the images and icons that read it, unless told to skip", async () => {
    calls.length = 0;
    const root = tempRepo();
    await applyInit({ root, answers: answers(), run });
    expect(calls).toEqual([
      ["pnpm", "exec", "tsx", "scripts/generate-theme.ts"],
      ["node", "scripts/make-placeholder-images.mjs"],
      ["node", "scripts/make-brand-assets.mjs"],
    ]);
    calls.length = 0;
    await applyInit({ root: tempRepo(), answers: answers(), run, skipAssets: true });
    expect(calls).toEqual([]);
  });

  it("installs only what it has the facts for, and says what is left", async () => {
    const root = tempRepo();
    const report = await applyInit({ root, answers: answers({ hosting: undefined, audio: undefined }), run, skipAssets: true });
    expect(existsSync(join(root, ".github/workflows/test-deployed-site.yml"))).toBe(false);
    expect(existsSync(join(root, ".github/workflows/sync-puck-registry.yml"))).toBe(false);
    expect(text(root, ".github/workflows/promote-pantheon.yml")).toContain("your-site-name");
    expect(report.installed).toEqual({ deployedSite: false, registrySync: false });
    expect(report.notes.join("\n")).toMatch(/No Pantheon site recorded/);
    expect(report.notes.join("\n")).toMatch(/No P1 site id recorded/);
    expect(report.notes.join("\n")).toMatch(/No audio host recorded/);
    expect(report.secrets).toEqual([]);
  });

  it("changes nothing when an answer is invalid", async () => {
    const root = tempRepo();
    const before = text(root, "band.config.json");
    await expect(applyInit({ root, answers: answers({ type: { wordmarkFace: "maybe" } }), run, skipAssets: true })).rejects.toThrow(/type\.wordmarkFace/);
    expect(text(root, "band.config.json")).toBe(before);
    expect(existsSync(join(root, "docs"))).toBe(false);
  });

  it("changes nothing when CLAUDE.md has lost a template block", async () => {
    const root = tempRepo();
    const broken = text(root, "CLAUDE.md").replace("<!-- template:placeholders:start -->", "");
    writeFileSync(join(root, "CLAUDE.md"), broken);
    await expect(applyInit({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/template:placeholders/);
    expect(JSON.parse(text(root, "band.config.json")).setup.initialized).toBe(false);
  });

  it("refuses to run twice unless forced", async () => {
    const root = tempRepo();
    await applyInit({ root, answers: answers(), run, skipAssets: true });
    await expect(applyInit({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/already been set up/);
  });

  it("a forced re-run on a configured repo updates the config but leaves the already-rewritten CLAUDE.md alone, and says so", async () => {
    const root = tempRepo();
    await applyInit({ root, answers: answers(), today: "2026-10-23", run, skipAssets: true });
    const rewritten = text(root, "CLAUDE.md");
    const renamed = answers() as Record<string, any>;
    renamed.identity.name = "Orchard Neon";
    const report = await applyInit({ root, answers: renamed, force: true, run, skipAssets: true });
    expect(JSON.parse(text(root, "band.config.json")).band.name).toBe("Orchard Neon");
    expect(text(root, "CLAUDE.md")).toBe(rewritten);
    expect(report.notes.join("\n")).toMatch(/CLAUDE\.md was already rewritten/);
  });

  it("does not guess when a CLAUDE.md without markers meets an un-forced run", async () => {
    const root = tempRepo();
    writeFileSync(join(root, "CLAUDE.md"), "# CLAUDE.md\n\nAlready a band's file.\n");
    await expect(applyInit({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/template:intro/);
  });

  it("explains a malformed band.config.json instead of throwing a bare parse error", async () => {
    const root = tempRepo();
    writeFileSync(join(root, "band.config.json"), "{ not json");
    await expect(applyInit({ root, answers: answers(), run, skipAssets: true })).rejects.toThrow(/band\.config\.json is not valid JSON/);
  });

  it("leaves .gitignore alone when docs/ is already ignored, and appends it when it is not", async () => {
    const withIt = tempRepo();
    const before = text(withIt, ".gitignore");
    expect(before).toMatch(/^\/docs\/$/m);
    await applyInit({ root: withIt, answers: answers(), run, skipAssets: true });
    expect(text(withIt, ".gitignore")).toBe(before);
    const without = tempRepo();
    writeFileSync(join(without, ".gitignore"), "node_modules\n");
    await applyInit({ root: without, answers: answers(), run, skipAssets: true });
    expect(text(without, ".gitignore")).toBe("node_modules\n/docs/\n");
  });
});
