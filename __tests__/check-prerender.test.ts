import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../scripts/check-prerender.mjs");
const dirs: string[] = [];

function project(prerendered: string[]) {
  const root = mkdtempSync(join(tmpdir(), "check-prerender-"));
  dirs.push(root);
  const page = (route: string, source: string) => {
    const dir = join(root, "app", "(site)", route);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "page.tsx"), source);
  };
  page("", "const doc = await getP1Page('/');");
  page("bio", "const doc = await getP1Page('/bio');");
  page("tour", "const shows = await getShows();");
  page("albums/[slug]", "await getP1Page('/albums/x');"); // dynamic segment: not a fixed route
  page("e2e-fixtures/[name]", "await getP1Page('/x');");
  page("tickets", "export default function Page() { return null; }"); // reads no P1
  mkdirSync(join(root, ".next"), { recursive: true });
  writeFileSync(join(root, ".next", "prerender-manifest.json"), JSON.stringify({ routes: Object.fromEntries(prerendered.map((r) => [r, {}])) }));
  return root;
}

function run(root: string, env: Record<string, string> = {}) {
  const r = spawnSync("node", [script, "--root", root], { env: { ...process.env, ...env }, encoding: "utf-8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("check-prerender", () => {
  it("passes when every page that reads P1 was prerendered", () => {
    const r = run(project(["/", "/bio", "/tour"]));
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/all 3 P1-backed routes/);
  });

  it("fails and names the routes that went dynamic (the SDK's connection() fallback when P1 refuses the key)", () => {
    const r = run(project(["/"]));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/\n {2}\/bio\n/);
    expect(r.out).toMatch(/\n {2}\/tour\n/);
    expect(r.out).not.toMatch(/\n {2}\/\n/);
    expect(r.out).toMatch(/CSS_API_KEY_LIVE/);
  });

  it("ignores dynamic segments, the fixture route and pages that do not read P1", () => {
    const r = run(project(["/", "/bio", "/tour"]));
    expect(r.out).not.toMatch(/slug|e2e-fixtures|tickets/);
  });

  it("lets the build through with ALLOW_DYNAMIC_P1_ROUTES=1, still listing what is dynamic", () => {
    const r = run(project(["/"]), { ALLOW_DYNAMIC_P1_ROUTES: "1" });
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/\/bio/);
  });

  it("fails when there is no build to check", () => {
    const root = mkdtempSync(join(tmpdir(), "check-prerender-"));
    dirs.push(root);
    expect(run(root).code).toBe(2);
  });
});
