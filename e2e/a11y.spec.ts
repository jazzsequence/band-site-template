import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Every public route, with one representative dynamic page of each kind. */
const routes = [
  "/",
  "/albums",
  "/albums/tribute",
  "/albums/ep",
  "/albums/unreleased",
  "/listen",
  "/lyrics",
  "/lyrics/say-when",
  "/lyrics/seniority",
  "/lyrics/banmal", // Korean text
  "/well-enough",
  "/tour",
  "/tickets/sf-1997-10-07",
  "/tickets/seattle-1997-10-23", // sold-out variant
  "/ticket?show=sf-1997-10-07&name=Test%20Name&qty=2&order=PRS-TEST01",
  "/ticket", // missing-details variant
  "/press",
  "/bio",
  "/merch",
  "/privacy",
  // Unknown URLs go through the P1 catch-all, which needs real P1 credentials; CI has none.
  // P1-only pages have no repo copy, so CI (placeholder credentials) cannot render them.
  ...(process.env.A11Y_P1_ROUTES ? ["/press/kit", "/this-page-does-not-exist"] : []),
];

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const route of routes) {
  test(`no axe violations: ${route}`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(
      violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`),
    ).toEqual([]);
  });
}

test("each page has exactly one h1, a main landmark and a skip link", async ({ page }) => {
  for (const route of routes.filter((r) => r !== "/this-page-does-not-exist")) {
    await page.goto(route);
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.locator("main"), route).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Skip to content" }), route).toHaveCount(1);
  }
});

test("the skip link is the first focusable element and moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("the ticket form is operable by keyboard and labelled", async ({ page }) => {
  await page.goto("/tickets/sf-1997-10-07");
  await page.getByLabel("Name on ticket").fill("Test Name");
  await page.getByLabel("Tickets").selectOption("2");
  await page.getByRole("button", { name: "Complete purchase" }).press("Enter");
  await expect(page).toHaveURL(/\/ticket\?/);
  await expect(page.getByRole("img", { name: /Ticket QR code/ })).toBeVisible();
});

test("focus indicators are visible on interactive elements", async ({ page }) => {
  await page.goto("/tour");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // wordmark
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(outline.style).not.toBe("none");
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});

test("respects reduced motion: nothing animates beyond a trivial duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const longest = await page.evaluate(() =>
    Math.max(
      0,
      ...[...document.querySelectorAll("*")].map((el) => {
        const d = getComputedStyle(el).animationDuration.split(",").map(parseFloat);
        return Math.max(...d.map((n) => (Number.isFinite(n) ? n : 0)));
      }),
    ),
  );
  expect(longest).toBeLessThanOrEqual(0.01);
});
