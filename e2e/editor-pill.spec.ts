import { expect, test } from "@playwright/test";

/**
 * Signed-in editors see a small "P1" pill on public pages. It must never sit on top of the site header
 * (it once covered the last nav link), and its menu must stay on screen.
 */
// The pill only appears on pages rendered from P1. In CI that is the test-only /e2e-fixtures route, which renders
// the P1 page definitions through the same pipeline, so these run everywhere with no credentials.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("p1_logged_in", "1"));
});

for (const route of ["/e2e-fixtures/home", "/e2e-fixtures/listen", "/e2e-fixtures/well-enough"]) {
  test(`the editor pill does not overlap the header on ${route}`, async ({ page }) => {
    await page.goto(route);
    const pill = page.locator("[data-p1-widget] > button");
    await expect(pill).toBeVisible();
    const pillBox = (await pill.boundingBox())!;
    const header = (await page.locator("header").first().boundingBox())!;
    expect(pillBox.y).toBeGreaterThan(header.y + header.height);

    for (const link of await page.getByRole("navigation", { name: "Primary" }).getByRole("link").all()) {
      const b = (await link.boundingBox())!;
      const overlaps = pillBox.x < b.x + b.width && pillBox.x + pillBox.width > b.x && pillBox.y < b.y + b.height && pillBox.y + pillBox.height > b.y;
      expect(overlaps, `pill overlaps the "${await link.innerText()}" nav link`).toBe(false);
    }
  });
}

test("the pill's menu opens upward and stays fully on screen", async ({ page }) => {
  await page.goto("/e2e-fixtures/home");
  await page.locator("[data-p1-widget] > button").click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const box = (await menu.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  await expect(page.getByRole("menuitem", { name: "Edit this page" })).toBeVisible();
});
