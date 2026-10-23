import { describe, expect, it } from "vitest";

import { AnswersError, parseAnswers } from "../lib/init/answers";
import { suggestPalette } from "../lib/init/palette-suggest";

const good = () => ({
  identity: {
    name: "Neon Orchard",
    tagline: "Slow synths for fast nights.",
    description: "Neon Orchard is a three-piece making slow synth music for fast nights.",
    genre: "Synthpop",
    fictional: true,
    siteUrl: "https://neon-orchard.example.com",
    social: [{ label: "Bandcamp", url: "https://neonorchard.bandcamp.com" }],
    offLimits: ["a topic the band never discusses"],
  },
  look: { palette: suggestPalette({ hue: 150, loudness: "balanced", scheme: "triad" }) },
  type: { wordmarkFace: true, accentFace: false },
  features: { tour: true, merch: false, lyrics: true, map: true, press: false },
  audio: { baseUrl: "https://audio.neon-orchard.example.com" },
  hosting: { pantheonSite: "neon-orchard", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" },
});

const problems = (raw: unknown) => {
  try {
    parseAnswers(raw, 2026);
  } catch (e) {
    expect(e).toBeInstanceOf(AnswersError);
    return (e as AnswersError).problems.join("\n");
  }
  return "";
};

describe("parseAnswers", () => {
  it("accepts a complete set of answers and builds the band.config.json to write", () => {
    const { config, answers, adjustments } = parseAnswers(good(), 2026);
    expect(config).toMatchObject({
      band: { name: "Neon Orchard", genre: "Synthpop", fictional: true, copyrightYear: 2026, social: [{ label: "Bandcamp" }] },
      features: { tour: true, merch: false, lyrics: true, map: true, press: false },
      typography: { wordmarkFace: true, accentFace: false },
      setup: { initialized: true },
      hosting: { pantheonSite: "neon-orchard" },
      editorial: { offLimitsFile: "docs/off-limits.md" },
    });
    expect(answers.audio?.baseUrl).toBe("https://audio.neon-orchard.example.com");
    expect(Array.isArray(adjustments)).toBe(true);
  });

  it("never puts the off-limits topics into the config it returns", () => {
    expect(JSON.stringify(parseAnswers(good(), 2026).config)).not.toContain("never discusses");
  });

  it("works with only the required answers", () => {
    const a = good() as Record<string, any>;
    delete a.audio;
    delete a.hosting;
    delete a.identity.social;
    delete a.identity.offLimits;
    const { config } = parseAnswers(a, 2031);
    expect(config).toMatchObject({ band: { copyrightYear: 2031, social: [] }, setup: { initialized: true } });
    expect(config).not.toHaveProperty("hosting");
  });

  it("names problems by the section the person answered, all at once", () => {
    const a = good() as Record<string, any>;
    a.identity.name = "";
    a.identity.siteUrl = "http://nope.example";
    a.type = { wordmarkFace: "yes" };
    a.features.map = true;
    a.features.tour = false;
    a.audio = { baseUrl: "https://audio.example.com/path" };
    const out = problems(a);
    expect(out).toContain("identity.name must be a non-empty string");
    expect(out).toContain("identity.siteUrl must be an https:// URL");
    expect(out).toContain("type.wordmarkFace must be true or false");
    expect(out).toContain("features.map needs features.tour");
    expect(out).toContain("audio.baseUrl must be an https:// origin");
  });

  it("rejects a palette the gate cannot repair, with the reason", () => {
    const a = good() as Record<string, any>;
    a.look.palette = { ...a.look.palette, surface: "#f0f0f0" };
    expect(problems(a)).toMatch(/palette\.surface .* too light/);
  });

  it("reports a palette with missing roles under look.palette", () => {
    const a = good() as Record<string, any>;
    delete a.look.palette.accent;
    expect(problems(a)).toContain("palette.accent is missing");
  });

  it("validates the GitHub owner", () => {
    const a = good() as Record<string, any>;
    a.github = { owner: "neon-orchard" };
    expect(parseAnswers(a, 2026).answers.github).toEqual({ owner: "neon-orchard" });
    a.github = { owner: "not a login!" };
    expect(problems(a)).toContain("github.owner must be a GitHub user or organisation name");
  });

  it("rejects a bad off-limits list and a missing section", () => {
    const a = good() as Record<string, any>;
    a.identity.offLimits = ["ok", ""];
    delete a.features;
    const out = problems(a);
    expect(out).toContain("identity.offLimits must be a list");
    expect(out).toContain("features must be an object");
  });

  it("lifts a failing text colour and reports it, keeping the author's value in the config", () => {
    const a = good() as Record<string, any>;
    a.look.palette = { ...a.look.palette, accent: "#4a1030" };
    const { config, adjustments } = parseAnswers(a, 2026);
    expect(adjustments.map((x) => x.key)).toContain("accent");
    expect((config.palette as Record<string, string>).accent).toBe("#4a1030");
  });
});
