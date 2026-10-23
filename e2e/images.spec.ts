import { expect, test } from "@playwright/test";

/**
 * Every image the site shows must actually exist. Local images carry a per-build version query, so this
 * also proves that versioned URLs resolve. A missing file fails here instead of showing as a broken
 * picture on the live site.
 */
const routes = ["/", "/bio", "/tour", "/merch", "/listen", "/albums", "/albums/ep", "/albums/tribute", "/albums/unreleased", "/well-enough", "/press"];

for (const route of routes) {
  test(`every image on ${route} loads`, async ({ page, request }) => {
    await page.goto(route);
    const srcs = await page.evaluate(() => [...new Set([...document.images].map((i) => i.currentSrc || i.src))]);
    for (const src of srcs.filter((s) => s.startsWith("http"))) {
      const res = await request.get(src);
      expect(res.status(), `${src} returned ${res.status()}`).toBe(200);
      expect(res.headers()["content-type"], src).toMatch(/^image\//);
    }
  });
}

test("local images are versioned per build", async ({ page }) => {
  await page.goto("/merch");
  const local = await page.evaluate(() => [...document.images].map((i) => i.getAttribute("src") ?? "").filter((s) => s.startsWith("/images/")));
  expect(local.length).toBeGreaterThan(0);
  for (const src of local) expect(src, src).toMatch(/\?v=[a-z0-9]+$/);
});
