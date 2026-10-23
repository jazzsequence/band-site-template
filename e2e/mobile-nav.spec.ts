import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const nav = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Primary" });
const menuButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Menu" });

test.describe("below 1024px: hamburger menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("links are hidden behind a menu button until it is opened", async ({ page }) => {
    await page.goto("/");
    await expect(menuButton(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(nav(page)).toBeHidden();
    await menuButton(page).click();
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "true");
    await expect(nav(page)).toBeVisible();
    for (const name of ["Tour", "Listen", "Albums", "Lyrics", "Well Enough", "Press", "Bio", "Merch"]) {
      await expect(nav(page).getByRole("link", { name })).toBeVisible();
    }
  });

  test("every menu item and the button are comfortable touch targets", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    const button = (await menuButton(page).boundingBox())!;
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
    for (const link of await nav(page).getByRole("link").all()) {
      expect((await link.boundingBox())!.height, await link.innerText()).toBeGreaterThanOrEqual(40);
    }
  });

  test("choosing a link navigates without a reload and closes the menu", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => ((window as unknown as Record<string, unknown>).__noReload = true));
    await menuButton(page).click();
    await nav(page).getByRole("link", { name: "Tour" }).click();
    await expect(page).toHaveURL(/\/tour$/);
    await expect(nav(page)).toBeHidden();
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__noReload)).toBe(true);
  });

  test("Escape closes the menu and returns focus to the button", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await expect(nav(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav(page)).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  });

  test("the current page is marked in the open menu", async ({ page }) => {
    await page.goto("/tour");
    await menuButton(page).click();
    await expect(nav(page).getByRole("link", { name: "Tour" })).toHaveAttribute("aria-current", "page");
  });

  test("the open menu has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe("1024px and up: inline links", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("no menu button, all links visible", async ({ page }) => {
    await page.goto("/");
    await expect(menuButton(page)).toBeHidden();
    await expect(nav(page)).toBeVisible();
    await expect(nav(page).getByRole("link")).toHaveCount(8);
  });
});
