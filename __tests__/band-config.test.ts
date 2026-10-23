import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it, vi } from "vitest";

import { BandConfigError, FEATURES, parseBandConfig } from "../lib/band/config";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const valid = JSON.parse(readFileSync(resolve(root, "band.config.json"), "utf-8"));
const clone = () => structuredClone(valid) as Record<string, any>;

const problems = (config: unknown) => {
  try {
    parseBandConfig(config);
  } catch (e) {
    expect(e).toBeInstanceOf(BandConfigError);
    return (e as BandConfigError).problems.join("\n");
  }
  return "";
};

describe("band.config.json", () => {
  it("is valid as committed", () => {
    expect(problems(valid)).toBe("");
    expect(Object.keys(parseBandConfig(valid).features).sort()).toEqual([...FEATURES].sort());
  });

  it("lists every problem at once", () => {
    const c = clone();
    c.band.name = "";
    c.band.siteUrl = "http://insecure.example";
    c.band.copyrightYear = "soon";
    c.features.tour = "yes";
    delete c.typography;
    const out = problems(c);
    expect(out).toContain("band.name must be a non-empty string");
    expect(out).toContain("band.siteUrl must be an https:// URL");
    expect(out).toContain("band.copyrightYear must be a four-digit year");
    expect(out).toContain("features.tour must be true or false");
    expect(out).toContain("typography must be an object");
  });

  it("rejects an unknown feature and a map without a tour", () => {
    const unknown = clone();
    unknown.features.podcast = true;
    expect(problems(unknown)).toContain("features.podcast is not a known feature");
    const mapOnly = clone();
    mapOnly.features.tour = false;
    mapOnly.features.map = true;
    expect(problems(mapOnly)).toContain("features.map needs features.tour");
  });

  it("checks social links", () => {
    const c = clone();
    c.band.social = [{ label: "Bandcamp", url: "https://band.example" }, { label: "Nope", url: "javascript:alert(1)" }];
    expect(problems(c)).toContain("band.social[1] needs a label and an https:// url");
  });

  it("keeps the off-limits list local: it must live under docs/, which is gitignored", () => {
    for (const bad of ["notes.md", "/etc/passwd", "docs/../secret.md", ""]) {
      const c = clone();
      c.editorial.offLimitsFile = bad;
      expect(problems(c), bad).toContain("editorial.offLimitsFile");
    }
    const gitignore = readFileSync(resolve(root, ".gitignore"), "utf-8");
    expect(gitignore).toMatch(/^\/docs\/$/m);
    expect(valid.editorial.offLimitsFile.startsWith("docs/")).toBe(true);
  });

  it("tracks whether /init-band has run in setup.initialized", () => {
    const fresh = clone();
    fresh.setup = { initialized: false };
    expect(parseBandConfig(fresh).setup.initialized).toBe(false);
    const done = clone();
    done.setup.initialized = true;
    expect(parseBandConfig(done).setup.initialized).toBe(true);
    const old = clone();
    delete old.setup;
    delete old.hosting;
    expect(parseBandConfig(old)).toMatchObject({ setup: { initialized: false }, hosting: {} });
    old.setup = { initialized: "yes" };
    expect(problems(old)).toContain("setup.initialized must be true or false");
  });

  it("checks the hosting facts it records", () => {
    const c = clone();
    c.hosting = { pantheonSite: "my-band-site", p1SiteId: "0e5a1c2e-9d3b-4f60-8a7e-1b2c3d4e5f60" };
    expect(parseBandConfig(c).hosting).toEqual(c.hosting);
    c.hosting = { pantheonSite: "Not A Machine Name", p1SiteId: "x" };
    const out = problems(c);
    expect(out).toContain("hosting.pantheonSite must be a Pantheon site machine name");
    expect(out).toContain("hosting.p1SiteId must be a P1 site id");
  });

  it("allows an optional imprint and rejects an empty one", () => {
    const c = clone();
    c.band.imprint = "Label Name, distributed by Distributor";
    expect(parseBandConfig(c).band.imprint).toBe("Label Name, distributed by Distributor");
    c.band.imprint = "  ";
    expect(problems(c)).toContain("band.imprint");
  });
});

describe("features switch sections off", () => {
  it("drops them from the navigation, the sitemap and llms.txt", async () => {
    vi.resetModules();
    vi.doMock("../lib/band/config", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../lib/band/config")>();
      return { ...actual, features: { tour: false, merch: false, lyrics: false, map: false, press: false } };
    });
    const { navLinks } = await import("../design-system/components/SiteHeader");
    expect(navLinks.filter(([, , on]) => on).map(([label]) => label)).toEqual(["Listen", "Albums", "Bio"]);

    const sitemap = (await import("../app/sitemap")).default;
    const urls = (await sitemap()).map((e) => new URL(e.url).pathname);
    for (const off of ["/tour", "/merch", "/lyrics", "/press", "/press/kit"]) expect(urls).not.toContain(off);
    expect(urls.some((u) => u.startsWith("/tickets/") || u.startsWith("/lyrics/"))).toBe(false);
    expect(urls).toEqual(expect.arrayContaining(["/", "/listen", "/albums", "/bio", "/privacy"]));

    const llms = await (await import("../app/llms.txt/route")).GET().text();
    expect(llms).not.toMatch(/\/tour|\/lyrics|\/press/);
    vi.doUnmock("../lib/band/config");
    vi.resetModules();
  });
});
