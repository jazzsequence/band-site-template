import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "app/(site)");

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pages(full);
    return name === "page.tsx" ? [full] : [];
  });
}

// What reads P1 content (or the data its blocks need). A page that does is cached and refreshed on a schedule, so a page published in P1
// reaches visitors even when nothing calls revalidatePath for it. Without a `revalidate` the page is prerendered once and, on Pantheon,
// served from the edge for a year (measured: `s-maxage=31536000`) until the next deploy.
const READS_P1 = /\b(getP1Page|getShows|getSiteData|loadPublishedPage)\(/;

describe("pages that read P1 content have a revalidation window", () => {
  const readers = pages(site).filter((file) => READS_P1.test(readFileSync(file, "utf-8")));

  it("finds the pages it is meant to cover", () => {
    const names = readers.map((f) => relative(site, f));
    for (const expected of ["page.tsx", "albums/page.tsx", "lyrics/page.tsx", "press/page.tsx", "privacy/page.tsx", "tour/page.tsx", "bio/page.tsx"]) {
      expect(names, expected).toContain(expected);
    }
  });

  // The test-only fixture route renders on request by design (force-dynamic).
  it.each(readers.filter((f) => !f.includes("e2e-fixtures")).map((f) => [relative(root, f), f]))(
    "%s exports revalidate as a literal",
    (_name, file) => {
      // Next reads segment config statically: a value computed or re-exported from elsewhere is ignored.
      expect(readFileSync(file, "utf-8")).toMatch(/^export const revalidate = \d+;$/m);
    },
  );
});
