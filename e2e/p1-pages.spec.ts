import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The P1 versions of the pages, rendered from content/p1-pages/*.json through the real P1 pipeline (the
 * test-only /e2e-fixtures route), checked against the code versions they replace. CI has no P1 credentials,
 * so this is what proves the blocks work: same words as today's page, one h1, no accessibility violations,
 * every image loads.
 */
const PAIRS: [fixture: string, route: string][] = [
  ["home", "/"],
  ["listen", "/listen"],
  ["albums", "/albums"],
  ["albums-ep", "/albums/ep"],
  ["albums-tribute", "/albums/tribute"],
  ["albums-unreleased", "/albums/unreleased"],
  ["well-enough", "/well-enough"],
  ["lyrics", "/lyrics"],
  ["press", "/press"],
  ["privacy", "/privacy"],
];

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The words on the page, ignoring the parts that differ by design (breadcrumbs, the editor pill). */
async function words(page: Page) {
  // Read the live page (a detached copy loses layout, so spacing and casing would differ) with the parts that
  // differ by design hidden.
  return page.evaluate(() => {
    const hidden = [...document.querySelectorAll<HTMLElement>('main nav[aria-label="Breadcrumb"], main script, [data-p1-widget]')];
    hidden.forEach((e) => e.style.setProperty("display", "none", "important"));
    const text = document.querySelector("main")!.innerText.replace(/\s+/g, " ").trim();
    hidden.forEach((e) => e.style.removeProperty("display"));
    return text;
  });
}

for (const [fixture, route] of PAIRS) {
  test.describe(`P1 page ${route}`, () => {
    test("says the same thing as the code version", async ({ page }) => {
      await page.goto(route);
      const code = await words(page);
      await page.goto(`/e2e-fixtures/${fixture}`);
      const p1 = await words(page);
      expect(p1.length).toBeGreaterThan(50);
      expect(p1).toBe(code);
    });

    test("has exactly one h1 and passes the accessibility scan", async ({ page }) => {
      await page.goto(`/e2e-fixtures/${fixture}`);
      await expect(page.locator("h1")).toHaveCount(1);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`)).toEqual([]);
    });

    test("every image loads", async ({ page, request }) => {
      await page.goto(`/e2e-fixtures/${fixture}`);
      const srcs = await page.evaluate(() => [...new Set([...document.images].map((i) => i.currentSrc || i.src))]);
      for (const src of srcs.filter((s) => s.startsWith("http"))) {
        const res = await request.get(src);
        expect(res.status(), `${src} returned ${res.status()}`).toBe(200);
      }
    });
  });
}

test("the test-only route is a 404 for an unknown page", async ({ page }) => {
  expect((await page.goto("/e2e-fixtures/nope"))?.status()).toBe(404);
});

test("catalog blocks are driven by the catalog, not typed text", async ({ page }) => {
  await page.goto("/e2e-fixtures/albums-ep");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("EP");
  await expect(page.getByRole("listitem").filter({ hasText: "Consent of the Quiet (v1)" })).toBeVisible();
  await page.goto("/e2e-fixtures/lyrics");
  expect(await page.getByRole("link", { name: /Say when/ }).count()).toBeGreaterThan(0);
});
