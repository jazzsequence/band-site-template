import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

type Rule = { source: string; has?: { type: string; key: string }[]; missing?: { type: string; key: string }[]; headers: { key: string; value: string }[] };
const rules = (await nextConfig.headers!()) as Rule[];
const cacheControl = (r: Rule) => r.headers.find((h) => h.key === "Cache-Control")?.value;
const cached = rules.filter((r) => cacheControl(r));

// Local images are referenced as /images/x.jpg?v=<build> (design-system/asset.ts), so the URL changes with every build. Anything else in
// public/ keeps its URL when its content changes, so it must never be cached for good.
describe("caching of files in public/", () => {
  it("caches a versioned image for a year, and only when the URL carries the version", () => {
    const rule = cached.find((r) => r.source === "/images/:path*" && r.has);
    expect(rule?.has).toEqual([{ type: "query", key: "v" }]);
    expect(cacheControl(rule!)).toBe("public, max-age=31536000, immutable");
  });

  it("never marks anything immutable unless it matches on the version", () => {
    for (const r of cached.filter((c) => /immutable/.test(cacheControl(c)!))) {
      expect(r.has, r.source).toEqual([{ type: "query", key: "v" }]);
    }
  });

  it("caches the unversioned images, icons and social card for an hour, serving stale for a day while it refreshes", () => {
    for (const source of ["/images/:path*", "/icons/:path*", "/og-default.jpg"]) {
      const rule = cached.find((r) => r.source === source && r.missing);
      expect(rule?.missing, source).toEqual([{ type: "query", key: "v" }]);
      expect(cacheControl(rule!), source).toBe("public, max-age=3600, stale-while-revalidate=86400");
    }
  });

  it("leaves the pages and API routes to the framework's own Cache-Control", () => {
    for (const r of cached) expect(r.source).toMatch(/^\/(images|icons|og-default)/);
  });
});
