import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf-8");
const scripts = Object.keys(JSON.parse(read("package.json")).scripts as Record<string, string>);

// README.md is the template's front page and /init-band replaces it, so these only apply while the repo is the template. SETUP.md stays.
describe.each(["README.md", "SETUP.md", "CONTENT.md"])("%s", (file) => {
  const text = read(file);

  it("links only to files that exist", () => {
    const links = [...text.matchAll(/\]\((?!https?:|#|mailto:)([^)\s#]+)(?:#[^)]*)?\)/g)].map((m) => m[1]);
    for (const link of links) expect(existsSync(resolve(root, link)), `${file} links to ${link}`).toBe(true);
  });

  it("mentions only pnpm scripts that exist", () => {
    const builtins = new Set(["install", "exec", "dlx", "add", "run", "storybook", "build-storybook"]);
    for (const m of text.matchAll(/`pnpm ([a-z][a-z0-9:-]*)/g)) {
      const name = m[1];
      expect(builtins.has(name) || scripts.includes(name), `${file} mentions pnpm ${name}`).toBe(true);
    }
  });
});

describe("SETUP.md", () => {
  const text = read("SETUP.md");

  it("names the workflows and secrets the repository actually uses", () => {
    for (const workflow of ["Promote to Pantheon Environment", "Sync Puck Component Registry", "Test deployed site", "Storybook preview"]) {
      expect(text, workflow).toContain(workflow);
    }
    for (const name of ["PANTHEON_MACHINE_TOKEN", "CSS_BASE_URL", "CSS_SITE_ID", "CSS_REGISTRY_API_KEY", "CSS_API_KEY_LIVE", "NEXT_PUBLIC_CSS_BASE_URL", "R2_BUCKET"]) {
      expect(text, name).toContain(name);
    }
  });

  it("repeats the lessons that cost time: exclude gh-pages from rulesets, Dependabot secrets, no --rebuild on site-level secrets", () => {
    expect(text).toContain("exclude `gh-pages`");
    expect(text).toContain("Dependabot");
    expect(text).toContain("fatals");
  });

  it("tells people to require the job names, which is what a required check matches, not the workflow names", () => {
    expect(read(".github/workflows/test-pantheon.yml")).toContain("name: Test (no Pantheon)");
    expect(read(".github/workflows/storybook-preview.yml")).toContain("name: Build and publish Storybook");
    expect(read("examples/workflows/test-deployed-site.yml")).toContain("name: Test deployed site");
    const required = text.match(/\| \*\*Required checks\*\* \|([^\n]*)\n/)?.[1] ?? "";
    for (const job of ["Test (no Pantheon)", "Build and publish Storybook", "Test deployed site"]) expect(required, job).toContain(`\`${job}\``);
    // A workflow name used as a required check never reports; it must only appear as the thing not to do.
    expect(required.replace(/a check called `Storybook preview`[^.]*\./, "")).not.toContain("`Storybook preview`");
  });

  it("matches the workflow names in the repository", () => {
    expect(read(".github/workflows/promote-pantheon.yml")).toContain("name: Promote to Pantheon Environment");
    expect(read("examples/workflows/sync-puck-registry.yml")).toContain("name: Sync Puck Component Registry");
    expect(read("examples/workflows/test-deployed-site.yml")).toContain("name: Test deployed site");
    expect(read(".github/workflows/storybook-preview.yml")).toContain("name: Storybook preview");
  });
});
