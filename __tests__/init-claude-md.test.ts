import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { parseAnswers } from "../lib/init/answers";
import { renderClaudeMd } from "../lib/init/claude-md";
import { suggestPalette } from "../lib/init/palette-suggest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(resolve(root, "CLAUDE.md"), "utf-8");

const { answers } = parseAnswers(
  {
    identity: {
      name: "Neon Orchard",
      tagline: "Slow synths for fast nights.",
      description: "Neon Orchard is a three-piece making slow synth music for fast nights.",
      genre: "Synthpop",
      fictional: true,
      siteUrl: "https://neon-orchard.example.com",
    },
    look: { palette: suggestPalette({ hue: 150 }) },
    type: { wordmarkFace: true, accentFace: false },
    features: { tour: true, merch: false, lyrics: true, map: true, press: false },
    audio: { baseUrl: "https://audio.neon-orchard.example.com" },
    hosting: { pantheonSite: "neon-orchard", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" },
  },
  2026,
);
const ctx = { answers, date: "2026-10-23", adjustments: [], offLimitsCount: 2, installed: { deployedSite: true, registrySync: true } };

describe("the template CLAUDE.md", () => {
  it("marks every block that only makes sense while the repo is the placeholder band", () => {
    for (const name of ["intro", "placeholders", "workflow-sync", "workflow-deploy"]) {
      expect(template, name).toContain(`<!-- template:${name}:start -->`);
      expect(template, name).toContain(`<!-- template:${name}:end -->`);
    }
  });

  it("tells a fresh session to run /init-band when setup has not run", () => {
    expect(template).toContain("## First run");
    expect(template).toMatch(/"initialized": false/);
    expect(template).toContain("`/init-band`");
  });
});

describe("renderClaudeMd", () => {
  const out = renderClaudeMd(template, ctx);

  it("removes every template marker and the template's first-run text", () => {
    expect(out).not.toContain("template:");
    expect(out).not.toContain("## First run");
    expect(out).not.toContain("Your Band");
    expect(out).not.toContain("came out of a production site");
  });

  it("states the band, the decisions made, and the date", () => {
    expect(out).toContain("Neon Orchard (a fictional act). Synthpop.");
    expect(out).toContain("## Setup decisions");
    expect(out).toContain("Recorded by `/init-band` on 2026-10-23.");
    expect(out).toContain("**Sections on:** Tour and tickets, Lyrics, Tour map.");
    expect(out).toContain("**Off:** Merch, Press");
    expect(out).toContain("wordmark face on (Unbounded, capitals)");
    expect(out).toContain("Pantheon site `neon-orchard`");
    expect(out).toContain("served from https://audio.neon-orchard.example.com");
  });

  it("reports how many off-limits entries there are but never what they are", () => {
    expect(out).toContain("It has 2 entries.");
    expect(renderClaudeMd(template, { ...ctx, offLimitsCount: 1 })).toContain("It has 1 entry.");
  });

  it("keeps the project's real rules untouched", () => {
    for (const heading of ["## Commit review (reviewer agent)", "## Commands", "## Architecture decisions", "## Accessibility", "## Palette", "## Design approval workflow"]) {
      expect(out, heading).toContain(heading);
    }
    expect(out.length).toBeGreaterThan(template.length * 0.8);
  });

  it("records which workflows were installed, and how to install the rest", () => {
    expect(out).toContain("`test-deployed-site.yml`, `sync-puck-registry.yml`");
    expect(out).toContain("- `sync-puck-registry.yml`: syncs the Puck registry");
    const none = renderClaudeMd(template, { ...ctx, installed: { deployedSite: false, registrySync: false } });
    expect(none).toContain("none yet (the examples are in `examples/workflows/`)");
    expect(none).toContain("`examples/workflows/sync-puck-registry.yml`: not installed");
    expect(none).toContain("`examples/workflows/test-deployed-site.yml`: not installed");
  });

  it("names the colours the gate lifted", () => {
    const lifted = renderClaudeMd(template, { ...ctx, adjustments: [{ key: "dim", from: "#111111", to: "#222222", reason: "x" }] });
    expect(lifted).toContain("lifted `dim` for contrast");
    expect(out).toContain("needed no adjustments");
  });

  it("says what was left undecided when hosting is not known yet", () => {
    const { answers: bare } = parseAnswers(
      {
        identity: { name: "Bare", tagline: "t", description: "d", genre: "g", fictional: false, siteUrl: "https://bare.example.com" },
        look: { palette: suggestPalette({ hue: 20 }) },
        type: { wordmarkFace: false, accentFace: false },
        features: { tour: false, merch: false, lyrics: false, map: false, press: false },
      },
      2026,
    );
    const text = renderClaudeMd(template, { ...ctx, answers: bare, installed: { deployedSite: false, registrySync: false } });
    expect(text).toContain("Pantheon site not set yet");
    expect(text).toContain("P1 site not set yet");
    expect(text).toContain("**Sections on:** none.");
    expect(text).toContain("Real tour venues must be checked");
  });

  it("refuses a CLAUDE.md that has lost a template block rather than guessing", () => {
    expect(() => renderClaudeMd(template.replace("<!-- template:placeholders:start -->", ""), ctx)).toThrow(/template:placeholders/);
  });
});
