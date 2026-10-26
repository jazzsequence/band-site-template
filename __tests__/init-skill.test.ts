import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { parseAnswers } from "../lib/init/answers";
import { resolveTypeAnswers } from "../lib/init/type-answers";
import { DEFAULT_TYPOGRAPHY } from "../lib/theme/fonts";
import { makeLookup } from "./fixtures/typography";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skill = readFileSync(resolve(root, ".claude/skills/init-band/SKILL.md"), "utf-8");
const cli = readFileSync(resolve(root, "scripts/init-band.ts"), "utf-8");
const example = JSON.parse(readFileSync(resolve(root, ".claude/skills/init-band/answers.example.json"), "utf-8"));

describe("the /init-band skill", () => {
  it("has the frontmatter Claude Code needs to find it, and says when to use it", () => {
    const front = skill.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    expect(front?.[1]).toBe("init-band");
    expect(front?.[2]).toMatch(/setup\.initialized false/);
  });

  it("only documents commands the CLI has", () => {
    const documented = [...skill.matchAll(/^\| `(status|suggest-palette|check-palette|font-info|apply)\b/gm)].map((m) => m[1]);
    expect(documented.sort()).toEqual(["apply", "check-palette", "font-info", "status", "suggest-palette"]);
    for (const c of documented) expect(cli, c).toContain(`case "${c}"`);
    for (const flag of ["--hue", "--loudness", "--scheme", "--force", "--skip-assets", "--role"]) expect(cli, flag).toContain(flag.slice(2));
  });

  it("states the rules that must never bend", () => {
    for (const rule of [
      "Secrets never pass through the chat",
      "The off-limits list stays local",
      "Do not edit around the placeholder",
      "Do not create a Pantheon site, a P1 site or any GitHub repo without an explicit yes",
      "Never use `USER_COMMIT=1` yourself",
    ]) {
      expect(skill, rule).toContain(rule);
    }
  });

  it("asks for a yes to the exact outward-facing action, not to the offer", () => {
    const step5 = skill.slice(skill.indexOf("## Step 5"), skill.indexOf("## Step 6"));
    expect(step5).toContain("explicit yes to that exact text");
    expect(step5.indexOf("terminus org:list")).toBeLessThan(step5.indexOf("terminus site:create"));
    const step7 = skill.slice(skill.indexOf("## Step 7"), skill.indexOf("## Step 8"));
    expect(step7).toContain("explicit yes to that exact action");
    expect(step7).toContain("Do not push a commit");
  });

  it("keeps drafted public copy clear of the local off-limits list, and stops when the repo cannot be identified", () => {
    expect(skill).toContain("check it against the local off-limits list");
    expect(skill).toContain("stop and ask what repository this is");
  });

  it("covers every batch of questions and the steps that follow", () => {
    for (const heading of ["## Step 0", "## Step 1: identity", "## Step 2: look", "## Step 3: type", "## Step 4: features and audio", "## Step 5: hosting", "## Step 6", "## Step 7: secrets", "## Step 8"]) {
      expect(skill, heading).toContain(heading);
    }
  });

  it("tells the person to check every font, what to do about one Fontsource does not have, and the design PR that is then owed", () => {
    const step3 = skill.slice(skill.indexOf("## Step 3"), skill.indexOf("## Step 4"));
    expect(step3).toContain("font-info");
    expect(step3).toContain("customFonts");
    expect(step3).toContain("stand-in");
    expect(step3).toContain("design PR after setup");
    expect(step3).toMatch(/do not look for a CDN link/);
    const step8 = skill.slice(skill.indexOf("## Step 8"), skill.indexOf("## Quick reference"));
    expect(step8).toContain("design-fonts-<name>");
    expect(step8).toContain("what licence they come under");
    expect(step8).toContain("wait for a yes");
  });

  it("refuses to run in the template repository itself", () => {
    expect(skill).toContain("isTemplate");
  });

  it("ships example answers that the real parser accepts, including the owner CODEOWNERS is pointed at", async () => {
    // type is font names; apply resolves them (here against a stand-in for Fontsource) before the rest is parsed.
    const { typography } = await resolveTypeAnswers(example.type, DEFAULT_TYPOGRAPHY, () => false, makeLookup().lookup);
    const parsed = parseAnswers({ ...example, type: typography }, 2026);
    expect(parsed.answers.github?.owner).toBeTruthy();
    expect(skill).toContain("github.owner");
    expect(skill).toContain("answers.example.json");
  });
});
