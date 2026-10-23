import { expect, test } from "@playwright/test";

/**
 * The audio player lives in the site layout, so it only survives navigation if links are client-side.
 * A full page load throws the document away, which stops playback. These tests plant a marker on
 * `window`; it only survives if the page was never reloaded.
 */
const MARKER = "__noReload";

async function navigateWithoutReload(page: import("@playwright/test").Page, start: string, click: () => Promise<void>, expectUrl: RegExp) {
  await page.goto(start);
  await page.evaluate((m) => {
    (window as unknown as Record<string, unknown>)[m] = true;
    // The audio element is what keeps playing, so track that exact node.
    (window as unknown as Record<string, unknown>).__audioNode = document.querySelector("audio");
  }, MARKER);
  await click();
  await expect(page).toHaveURL(expectUrl);
  const kept = await page.evaluate((m) => ({
    marker: (window as unknown as Record<string, unknown>)[m] === true,
    sameAudio: document.querySelector("audio") === (window as unknown as Record<string, unknown>).__audioNode,
    audioExists: !!document.querySelector("audio"),
  }), MARKER);
  expect(kept).toEqual({ marker: true, sameAudio: true, audioExists: true });
}

test("header links navigate without reloading the page", async ({ page, isMobile }) => {
  test.skip(isMobile === true, "covered by the desktop project; layout differs only in wrapping");
  await navigateWithoutReload(page, "/", () => page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Albums" }).click(), /\/albums$/);
  await navigateWithoutReload(page, "/albums", () => page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Tour" }).click(), /\/tour$/);
});

test("album cards and buttons navigate without reloading the page", async ({ page }) => {
  await navigateWithoutReload(page, "/albums", () => page.getByRole("link", { name: /^Tribute/ }).click(), /\/albums\/tribute$/);
  await navigateWithoutReload(page, "/", () => page.getByRole("link", { name: "All dates" }).click(), /\/tour$/);
  await navigateWithoutReload(page, "/lyrics", () => page.getByRole("link", { name: /Say when/ }).first().click(), /\/lyrics\/say-when$/);
});

test("the wordmark link goes home without reloading", async ({ page }) => {
  await navigateWithoutReload(page, "/bio", () => page.getByRole("link", { name: "PARIS, home" }).click(), /\/$/);
});

test("the site has a favicon, an apple touch icon and a theme colour", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#07050d");
  const ico = await request.get("/favicon.ico");
  expect(ico.status()).toBe(200);
  expect(ico.headers()["content-type"]).toMatch(/icon/);
});
