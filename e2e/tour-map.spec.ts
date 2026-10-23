import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// A 1x1 transparent PNG, so the tests never depend on (or send visitors' traffic to) OpenStreetMap.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

/** Stubs the tile server and counts what the page asks it for. */
async function trackTiles(page: Page) {
  const requests: string[] = [];
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
  });
  return requests;
}

/** Console errors that mean a security policy refused something the map needs. */
function policyErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /content security policy|refused to/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

for (const [route, label, pins] of [
  ["/tickets/sf-1997-10-07", "Where Roderick's Chamber is", 1],
  ["/tour", "Tour map", 9],
] as const) {
  test.describe(route, () => {
    test("asks nobody for a map until Show map is clicked", async ({ page }) => {
      const tiles = await trackTiles(page);
      await page.goto(route);
      await expect(page.getByRole("button", { name: "Show map" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(tiles).toEqual([]);
    });

    test("Show map loads the tiles and the pins, with no policy errors", async ({ page }) => {
      const tiles = await trackTiles(page);
      const errors = policyErrors(page);
      await page.goto(route);
      await page.getByRole("button", { name: "Show map" }).click();
      const region = page.getByRole("region", { name: `Map: ${label}` });
      await expect(region).toBeVisible();
      await expect(region.getByRole("img")).toHaveCount(pins);
      await expect.poll(() => tiles.length).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });

    test("the map open has no accessibility violations", async ({ page }) => {
      await trackTiles(page);
      await page.goto(route);
      await page.getByRole("button", { name: "Show map" }).click();
      await expect(page.getByRole("region", { name: `Map: ${label}` })).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}
