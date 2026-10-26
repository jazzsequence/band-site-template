import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skill = readFileSync(resolve(root, ".claude/skills/init-p1-pages/SKILL.md"), "utf-8");
const cli = readFileSync(resolve(root, "scripts/init-band.ts"), "utf-8");
const section = (from: string, to: string) => skill.slice(skill.indexOf(from), to ? skill.indexOf(to) : undefined);

describe("the /init-p1-pages skill", () => {
  it("has the frontmatter Claude Code needs to find it, and says when to use it and that it never publishes", () => {
    const front = skill.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    expect(front?.[1]).toBe("init-p1-pages");
    expect(front?.[2]).toMatch(/after \/init-band has run/);
    expect(front?.[2]).toMatch(/never publishes anything/);
  });

  it("states the rules that must never bend", () => {
    for (const rule of [
      "Never call `publish_page`",
      "Nothing is created until the person has seen the exact list and said yes to it",
      "A yes to the idea is not a yes to the list",
      "Never overwrite or edit an existing page",
      "No workstreams",
      "The bio is public copy",
      "Never touch another site",
    ]) {
      expect(skill, rule).toContain(rule);
    }
  });

  it("only mentions publish_page to forbid it or to say publishing is the person's", () => {
    const lines = skill.split("\n").filter((l) => l.includes("publish_page"));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l, l).toMatch(/Never call|Publishing is yours|publishing is yours/);
  });

  it("creates nothing before the yes: it checks the repo, the registry and what exists, and only step 5 calls create_page", () => {
    const step0 = section("## Step 0", "## Step 1");
    expect(step0).toContain("replaced the sample albums, shows, merch, lyrics and the press article");
    expect(step0).toContain("list_components");
    expect(step0).toContain("`list_sites` must list `hosting.p1SiteId`");
    expect(step0).toContain("print the exact command and wait for a yes");
    const step3 = section("## Step 3", "## Step 4");
    expect(step3).toContain("list_documents");
    expect(step3).toContain("Never overwrite it");
    expect(step3).toContain("separate yes");
    expect(step3).toContain("normalising them");
    expect(step3).toContain("cut off");
    expect(skill.indexOf("create_page")).toBeGreaterThan(skill.indexOf("## Step 5"));
    expect(skill.indexOf("## Step 4")).toBeLessThan(skill.indexOf("## Step 5"));
    expect(section("## Step 4", "## Step 5")).toContain("Nothing is published");
    expect(section("## Step 4", "## Step 5")).toContain("`/privacy`, is a test");
  });

  it("tests the draft assumption on a harmless page and waits for the person to confirm before creating the rest", () => {
    const step5 = section("## Step 5", "## Step 6");
    expect(step5).toContain("give no way to read a page's published state");
    expect(step5).toContain("First, the test page");
    expect(step5).toContain("same as the repo's own privacy page");
    expect(step5).toContain("Continue only when they confirm it is not live");
    expect(step5.indexOf("Continue only when they confirm")).toBeLessThan(step5.indexOf("Then the rest"));
    expect(section("## Step 6", "## Quick reference")).toContain("say what you checked, not more");
  });

  it("stops on a failure and never creates a page that was not approved", () => {
    const step5 = section("## Step 5", "## Step 6");
    expect(step5).toContain("stop, show the error, and ask");
    expect(step5).toContain("Never create a page that was not in the list the person approved");
    expect(step5).toContain("`documentPath`");
  });

  it("hands over with the pages as drafts and publishing as theirs", () => {
    const step6 = section("## Step 6", "## Quick reference");
    expect(step6).toContain("drafts");
    expect(step6).toContain("Publishing is yours");
    expect(step6).toContain("I have not published anything");
  });

  it("only documents what the CLI has", () => {
    expect(cli).toContain('case "p1-pages"');
    for (const flag of ["--bio", "--json"]) {
      expect(skill, flag).toContain(flag);
      expect(cli, flag).toContain(flag.slice(2));
    }
    expect(skill).toContain("| `p1-pages [--bio <file>] [--json]` |");
  });
});
