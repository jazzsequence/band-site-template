import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { setup } from "../lib/band/config";
import { parseAnswers } from "../lib/init/answers";
import { renderClaudeMd } from "../lib/init/claude-md";
import { suggestPalette } from "../lib/init/palette-suggest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The render tests use a small stand-in with the same markers, so they keep passing after /init-band has rewritten the real CLAUDE.md.
const template = readFileSync(resolve(root, "__tests__/fixtures/claude-template.md"), "utf-8");

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

// Only meaningful while the repo is still the template: /init-band replaces CLAUDE.md with the band's version, which has no markers.
describe.skipIf(setup.initialized)("the template CLAUDE.md", () => {
  const live = readFileSync(resolve(root, "CLAUDE.md"), "utf-8");

  it("marks every block that only makes sense while the repo is the placeholder band", () => {
    for (const name of ["intro", "placeholders", "workflow-sync", "workflow-deploy"]) {
      expect(live, name).toContain(`<!-- template:${name}:start -->`);
      expect(live, name).toContain(`<!-- template:${name}:end -->`);
    }
  });

  it("tells a fresh session to run /init-band when setup has not run", () => {
    expect(live).toContain("## First run");
    expect(live).toMatch(/"initialized": false/);
    expect(live).toContain("`/init-band`");
  });

  it("renders cleanly for a band", () => {
    const out = renderClaudeMd(live, ctx);
    expect(out).not.toContain("template:");
    expect(out).not.toContain("## First run");
    expect(out).toContain("## Setup decisions");
  });
});

describe("renderClaudeMd", () => {
  const out = renderClaudeMd(template, ctx);

  it("removes every template marker and the template's first-run text", () => {
    expect(out).not.toContain("template:");
    expect(out).not.toContain("## First run");
    expect(out).not.toContain("Your Band");
    expect(out).not.toContain("came out of a production site");
    expect(out).not.toContain("Band site template");
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
    expect(out.match(/Rules that stay\./g)).toHaveLength(4);
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
