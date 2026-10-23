import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "@playwright/test";

// Read as a file: Playwright's ESM loader rejects a bare JSON import.
const merchCount: number = (JSON.parse(readFileSync("data/merch.json", "utf8")) as unknown[]).length;

const opener = (page: import("@playwright/test").Page, name: RegExp) => page.getByRole("button", { name });

test("album cover opens larger, and Escape closes it and returns focus", async ({ page }) => {
  await page.goto("/albums/ep");
  const button = opener(page, /View larger: EP cover art/);
  await button.click();
  const dialog = page.getByRole("dialog", { name: "EP cover art" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: "EP cover art" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

test("it opens from the keyboard and traps focus inside", async ({ page }) => {
  await page.goto("/albums/ep");
  const button = opener(page, /View larger: EP cover art/);
  await button.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
});

test("the Close button and the backdrop both close it", async ({ page }) => {
  await page.goto("/albums/ep");
  await opener(page, /View larger/).first().click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await opener(page, /View larger/).first().click();
  await page.mouse.click(4, 4); // far corner: the backdrop
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the page behind does not scroll while it is open, and scrolls again after", async ({ page }) => {
  await page.goto("/albums/ep");
  await opener(page, /View larger/).first().click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  // The restore runs after React handles the dialog's close event, so wait for it rather than read at once.
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("the open lightbox has no accessibility violations", async ({ page }) => {
  await page.goto("/albums/ep");
  await opener(page, /View larger/).first().click();
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("images across the site open in a lightbox", async ({ page }) => {
  for (const [route, count] of [
    ["/well-enough", 3],
    ["/albums/ep", 3],
    ["/albums/tribute", 3],
    ["/listen", 4],
    ["/bio", 1],
    ["/merch", merchCount],
  ] as const) {
    await page.goto(route);
    await expect(opener(page, /View larger/), route).toHaveCount(count);
  }
});
