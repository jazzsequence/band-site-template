import { spawnSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { afterAll, describe, expect, it } from "vitest";

import { suggestPalette } from "../lib/init/palette-suggest";
import { validatePalette } from "../lib/theme/palette";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "init-cli-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const cli = (...args: string[]) => {
  const r = spawnSync("pnpm", ["exec", "tsx", "scripts/init-band.ts", ...args], { cwd: root, encoding: "utf-8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

describe("scripts/init-band.ts", () => {
  it("status says whether the repo has been set up", () => {
    const r = cli("status");
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toEqual({ initialized: expect.any(Boolean), name: expect.any(String) });
  });

  it("suggest-palette prints a valid palette on stdout and the contrast report on stderr", () => {
    const r = cli("suggest-palette", "--hue", "20", "--loudness", "loud", "--scheme", "complement");
    expect(r.code).toBe(0);
    expect(validatePalette(JSON.parse(r.out))).toBeTruthy();
    expect(r.err).toContain("Dark text on the fills that carry it");
    expect(r.err).toContain("Adjusted by the gate");
  });

  it("suggest-palette rejects a missing hue and an unknown loudness or scheme", () => {
    expect(cli("suggest-palette").code).toBe(1);
    expect(cli("suggest-palette").err).toContain("--hue is required");
    expect(cli("suggest-palette", "--hue", "10", "--loudness", "deafening").err).toContain("--loudness must be one of");
    expect(cli("suggest-palette", "--hue", "10", "--scheme", "rainbow").err).toContain("--scheme must be one of");
  });

  it("check-palette passes a good palette and exits 1 with the reason for one the gate rejects", () => {
    const good = join(dir, "good.json");
    writeFileSync(good, JSON.stringify(suggestPalette({ hue: 200 })));
    const ok = cli("check-palette", good);
    expect(ok.code).toBe(0);
    expect(ok.out).toContain("accent-3");

    const bad = join(dir, "bad.json");
    writeFileSync(bad, JSON.stringify({ ...suggestPalette({ hue: 200 }), surface: "#f0f0f0" }));
    const rejected = cli("check-palette", bad);
    expect(rejected.code).toBe(1);
    expect(rejected.out).toMatch(/^REJECTED/);
    expect(rejected.out).toContain("too light");
  });

  it("font-info asks for a name and a known role, and refuses something that is not a font name without a request", () => {
    expect(cli("font-info").err).toContain("Give the font's name");
    expect(cli("font-info", "--role", "body").err).toContain("Give the font's name");
    expect(cli("font-info", "Inter", "--role", "footer").err).toContain("--role must be one of display, body, wordmark, kicker");
    const r = cli("font-info", "???");
    expect(r.code).toBe(1);
    expect(r.err).toContain("is not a font name");
  });

  it("p1-pages refuses to build pages for a repo that is still the placeholder band", () => {
    const initialized = JSON.parse(cli("status").out).initialized;
    const r = cli("p1-pages");
    if (!initialized) {
      expect(r.code).toBe(1);
      expect(r.err).toContain("still the placeholder band");
    } else {
      // A repo that has been set up has a P1 site or says it has none.
      expect([0, 1]).toContain(r.code);
    }
  });

  it("apply explains a missing answers file and an invalid one, and changes nothing", () => {
    expect(cli("apply", join(dir, "nope.json")).err).toContain("Could not read");
    const invalid = join(dir, "invalid.json");
    writeFileSync(invalid, JSON.stringify({ identity: {} }));
    const r = cli("apply", invalid, "--skip-assets");
    expect(r.code).toBe(1);
    expect(r.err).toContain("init answers rejected");
    expect(r.err).toContain("identity.name must be a non-empty string");
  });

  it("prints usage for an unknown command", () => {
    const r = cli("nonsense");
    expect(r.code).toBe(1);
    expect(r.err).toContain("Usage:");
  });
});
