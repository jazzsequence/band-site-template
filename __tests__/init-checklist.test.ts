import { spawnSync } from "child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { parseAnswers } from "../lib/init/answers";
import { suggestPalette } from "../lib/init/palette-suggest";
import { renderReadme } from "../lib/init/readme";
import { formatChecklist, secretsChecklist } from "../lib/init/checklist";
import { DEFAULT_TYPOGRAPHY } from "../lib/theme/fonts";

const make = (extra: Record<string, unknown> = {}) =>
  parseAnswers(
    {
      identity: { name: "Neon Orchard", tagline: "Slow synths for fast nights.", description: "A three-piece making slow synth music.", genre: "Synthpop", fictional: true, siteUrl: "https://neon-orchard.example.com" },
      look: { palette: suggestPalette({ hue: 150 }) },
      type: DEFAULT_TYPOGRAPHY,
      features: { tour: true, merch: true, lyrics: true, map: true, press: true },
      audio: { baseUrl: "https://audio.neon-orchard.example.com" },
      hosting: { pantheonSite: "neon-orchard", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" },
      ...extra,
    },
    2026,
  ).answers;

describe("secretsChecklist", () => {
  const steps = secretsChecklist(make());
  const commands = steps.map((s) => s.command);

  it("covers the P1 keys, the audio bucket and the GitHub secrets for a fully specified band", () => {
    for (const name of ["CSS_API_KEY", "CSS_API_KEY_LIVE", "NEXT_PUBLIC_CSS_SITE_ID", "NEXT_PUBLIC_CSS_BASE_URL", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "NEXT_PUBLIC_AUDIO_BASE_URL"]) {
      expect(commands.some((c) => c.includes(` ${name} `)), name).toBe(true);
    }
    for (const name of ["PANTHEON_MACHINE_TOKEN", "CSS_BASE_URL", "CSS_SITE_ID", "CSS_REGISTRY_API_KEY"]) {
      expect(commands.some((c) => c.startsWith(`gh secret set ${name}`)), name).toBe(true);
    }
    expect(commands.filter((c) => c.includes("PANTHEON_MACHINE_TOKEN"))).toEqual(["gh secret set PANTHEON_MACHINE_TOKEN", "gh secret set PANTHEON_MACHINE_TOKEN --app dependabot"]);
  });

  it("never holds a secret value: every key is read from a hidden prompt and unset", () => {
    const secretNames = ["CSS_API_KEY", "CSS_API_KEY_LIVE", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
    for (const c of commands.filter((x) => x.startsWith("terminus") && secretNames.some((n) => x.includes(` ${n} `)))) {
      throw new Error(`secret set without a prompt: ${c}`);
    }
    for (const s of steps.filter((x) => /(API key|bucket: )/i.test(x.what))) {
      expect(s.command, s.what).toMatch(/^printf '%s' ".*" && read -rs V && echo && terminus .* "\$V".*; unset V$/);
    }
    expect(commands.filter((c) => c.startsWith("gh secret set") && c.includes("--body")).every((c) => /CSS_(BASE_URL|SITE_ID)/.test(c))).toBe(true);
  });

  it("keeps the drafts key off live: dev and test get CSS_API_KEY, live gets only CSS_API_KEY_LIVE", () => {
    const text = commands.join("\n");
    expect(text).toMatch(/terminus secret:site:set neon-orchard\.dev CSS_API_KEY /);
    expect(text).toMatch(/terminus secret:site:set neon-orchard\.test CSS_API_KEY /);
    expect(text).toMatch(/terminus secret:site:set neon-orchard\.live CSS_API_KEY_LIVE /);
    expect(text).not.toMatch(/neon-orchard\.live CSS_API_KEY /);
  });

  it("asks for nothing it cannot use: no hosting means no steps, no P1 site means no registry secrets", () => {
    expect(secretsChecklist(make({ hosting: undefined, audio: undefined }))).toEqual([]);
    const noP1 = secretsChecklist(make({ hosting: { pantheonSite: "neon-orchard" } })).map((s) => s.command).join("\n");
    expect(noP1).not.toContain("CSS_REGISTRY_API_KEY");
    expect(noP1).not.toContain("NEXT_PUBLIC_CSS_SITE_ID");
    expect(noP1).toContain("PANTHEON_MACHINE_TOKEN");
    const noAudio = secretsChecklist(make({ audio: undefined })).map((s) => s.command).join("\n");
    expect(noAudio).not.toContain("R2_");
  });

  it("puts --rebuild only on the per-environment keys, never on a site-level set (it fatals in the current Terminus)", () => {
    for (const c of commands.filter((x) => x.includes("--rebuild"))) expect(c, c).toMatch(/terminus secret:site:set neon-orchard\.(dev|test|live) /);
    expect(commands.filter((x) => /secret:site:set neon-orchard (R2_|NEXT_PUBLIC_)/.test(x)).some((x) => x.includes("--rebuild"))).toBe(false);
  });

  it("says where to get every value that is not the same for every site, and never puts a value in the source text", () => {
    const withSource = (needle: string) => steps.filter((s) => s.command.includes(needle)).map((s) => s.source ?? "");
    for (const name of ["NEXT_PUBLIC_CSS_SITE_ID", "CSS_API_KEY ", "CSS_API_KEY_LIVE", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "NEXT_PUBLIC_AUDIO_BASE_URL", "PANTHEON_MACHINE_TOKEN", "CSS_REGISTRY_API_KEY"]) {
      const sources = withSource(name);
      expect(sources.length, name).toBeGreaterThan(0);
      for (const s of sources) expect(s, `${name} has no source`).not.toBe("");
    }
    // The P1 base URL and the registry's copies of the base URL and site id are the same for every site, or already given above.
    expect(steps.find((s) => s.what.startsWith("P1 backend URL"))?.source).toBeUndefined();
    expect(steps.filter((s) => s.source).every((s) => !/(sat_|github_pat_|ghp_)/.test(s.source as string))).toBe(true);
  });

  it("tells the person about the traps: tokens shown once, the 90-day Pantheon token, a bucket in a jurisdiction, the r2.dev URL", () => {
    const text = formatChecklist(steps);
    expect(text).toContain("most are shown only once");
    expect(text).toContain("`terminus auth:login`");
    expect(text).toContain("`gh auth login`");
    expect(text).toContain("expires after 90 days");
    expect(text).toContain("must be in the default location, not a jurisdiction");
    expect(text).toContain("not the r2.dev URL");
    expect(text).toContain("Object Read only");
    expect(text).toContain("Get it: P1 dashboard");
  });

  it("formats as copy-paste text grouped by where it runs", () => {
    const text = formatChecklist(steps);
    expect(text).toContain("not in the chat");
    expect(text.indexOf("# Pantheon")).toBeLessThan(text.indexOf("# GitHub"));
    expect(text).toContain("rebuild every environment");
    expect(formatChecklist([])).toContain("nothing to set");
  });
});

// The generated prompt must really work in the shells people use: `read -p` is "prompt" in bash but "coprocess" in zsh, which once made
// every secret step silently do nothing for a zsh user.
const SHELLS = ["bash", "zsh"].filter((sh) => spawnSync("which", [sh]).status === 0);
describe.each(SHELLS)("a prompted command runs under %s", (shell) => {
  const step = secretsChecklist(make()).find((x) => x.what.includes("R2_SECRET_ACCESS_KEY"))!;

  it("reads the value from stdin, hands it to terminus, and leaves nothing behind", () => {
    const dir = mkdtempSync(join(tmpdir(), "init-secrets-"));
    try {
      const out = join(dir, "args.txt");
      writeFileSync(join(dir, "terminus"), '#!/bin/sh\nprintf "%s\\n" "$@" > "$OUT"\n');
      chmodSync(join(dir, "terminus"), 0o755);
      const r = spawnSync(shell, ["-c", `${step.command}; echo "V=[\${V-unset}]"`], {
        input: "hunter2\n",
        encoding: "utf-8",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, OUT: out },
      });
      expect(r.stderr, "no shell complained").toBe("");
      expect(existsSync(out), "terminus was run").toBe(true);
      const args = readFileSync(out, "utf-8").split("\n");
      expect(args).toEqual(expect.arrayContaining(["secret:site:set", "neon-orchard", "R2_SECRET_ACCESS_KEY", "hunter2", "--type=env", "--scope=web"]));
      expect(r.stdout).toContain("V=[unset]");
      expect(r.stdout).not.toContain("hunter2");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("renderReadme", () => {
  it("is the band's own README, not the template's", () => {
    const text = renderReadme(make());
    expect(text.startsWith("# Neon Orchard\n")).toBe(true);
    expect(text).toContain("fictional act");
    expect(text).toContain("`neon-orchard`");
    expect(text).toContain("https://neon-orchard.example.com");
    expect(text).toContain("[SETUP.md](SETUP.md)");
    expect(text).not.toContain("Band site template");
    expect(renderReadme(make({ identity: { ...make().identity, fictional: false } }))).not.toContain("fictional act");
  });
});
