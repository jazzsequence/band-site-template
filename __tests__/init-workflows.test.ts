import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { activateExample, setPantheonSiteName } from "../lib/init/workflows";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf-8");

describe("setPantheonSiteName", () => {
  it("sets the site name in the promote workflow and the deployed-site example", () => {
    for (const file of [".github/workflows/promote-pantheon.yml", "examples/workflows/test-deployed-site.yml"]) {
      const out = setPantheonSiteName(read(file), "neon-orchard");
      expect(out, file).toContain("PANTHEON_SITE_NAME: neon-orchard");
      expect(out, file).not.toContain("your-site-name");
      // Nothing else changes.
      expect(out.split("\n").length).toBe(read(file).split("\n").length);
    }
  });

  it("rejects a name that is not a Pantheon machine name, and a file that declares none", () => {
    expect(() => setPantheonSiteName(read("examples/workflows/test-deployed-site.yml"), "Not A Name")).toThrow(/machine name/);
    expect(() => setPantheonSiteName("name: x\n", "ok-name")).toThrow(/declares no PANTHEON_SITE_NAME/);
  });
});

describe("activateExample", () => {
  it.each(["examples/workflows/test-deployed-site.yml", "examples/workflows/sync-puck-registry.yml"])("turns %s into an installed workflow", (file) => {
    const out = activateExample(read(file));
    expect(out).not.toContain("EXAMPLE, NOT ACTIVE");
    expect(out).not.toContain("so GitHub does not run it");
    expect(out).toContain("# Installed from examples/workflows/ by /init-band.");
    // The explanation of what it does survives, and the jobs are untouched.
    expect(out).toMatch(/# (Optional:|What it does:)/);
    const from = (text: string) => text.slice(text.indexOf("\non:"));
    expect(from(out)).toBe(from(read(file)));
  });

  it("refuses a file that is not shaped like an example", () => {
    expect(() => activateExample("name: x\non: push\n")).toThrow(/missing its EXAMPLE header/);
  });
});
