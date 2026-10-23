import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { parseAnswers } from "../lib/init/answers";

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
    const documented = [...skill.matchAll(/^\| `(status|suggest-palette|check-palette|apply)\b/gm)].map((m) => m[1]);
    expect(documented.sort()).toEqual(["apply", "check-palette", "status", "suggest-palette"]);
    for (const c of documented) expect(cli, c).toContain(`case "${c}"`);
    for (const flag of ["--hue", "--loudness", "--scheme", "--force", "--skip-assets"]) expect(cli, flag).toContain(flag.slice(2));
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

  it("refuses to run in the template repository itself", () => {
    expect(skill).toContain("isTemplate");
  });

  it("ships example answers that the real parser accepts", () => {
    expect(() => parseAnswers(example, 2026)).not.toThrow();
    expect(skill).toContain("answers.example.json");
  });
});
