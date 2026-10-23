import { expect, test } from "@playwright/test";

import { band } from "./helpers/config";

/** Pages that render in a normal session; /ticket needs query parameters. */
const pages = [
  "/", "/albums", "/albums/first-ep", "/albums/unreleased", "/listen", "/lyrics", "/lyrics/first-song",
  "/tour", "/tickets/sample-city-2027-03-12", "/ticket?show=sample-city-2027-03-12&name=Test&qty=1&order=PRS-TEST01", "/press", "/bio", "/merch", "/privacy",
];

test.describe("security headers", () => {
  test("public pages send the full set", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["strict-transport-security"]).toMatch(/max-age=31536000/);
    expect(h["strict-transport-security"]).toMatch(/includeSubDomains/);
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toBeTruthy();
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["content-security-policy"]).toMatch(/frame-ancestors 'self'/);
    expect(h["content-security-policy"]).toMatch(/upgrade-insecure-requests/);
    expect(h["x-xss-protection"]).toBeUndefined();
  });

  test("the P1 editor is exempt from the public CSP so it keeps working", async ({ request }) => {
    const h = (await request.get("/p1")).headers();
    expect(h["content-security-policy"]).toBeUndefined();
    expect(h["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("no CSP violations", () => {
  for (const route of pages) {
    test(route, async ({ page }) => {
      const violations: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          (window as unknown as { __csp: string[] }).__csp ??= [];
          (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
        });
      });
      page.on("console", (m) => {
        if (/content security policy/i.test(m.text())) violations.push(m.text());
      });
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      violations.push(...((await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp)) ?? []));
      expect(violations).toEqual([]);
    });
  }
});

test.describe("discovery files", () => {
  test("robots.txt is valid and links the sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
    expect(body).toMatch(/Disallow: \/p1/);
  });

  test("sitemap lists pages, albums and lyrics but not the private ticket page", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toContain("/albums/first-ep");
    expect(body).toContain("/lyrics/first-song");
    expect(body).toContain("/tickets/sample-city-2027-03-12");
    expect(body).not.toMatch(/\/ticket<\/loc>/);
  });

  test("manifest has a maskable icon", async ({ request }) => {
    const m = await (await request.get("/manifest.webmanifest")).json();
    expect(m.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
    for (const i of m.icons) expect((await request.get(i.src)).status()).toBe(200);
  });

  test("llms.txt is plain text", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.headers()["content-type"]).toMatch(/text\/plain/);
    expect(await res.text()).toContain(`# ${band.name}`);
  });

  test("standard.site publication file is absent until a publication exists", async ({ request }) => {
    const res = await request.get("/.well-known/site.standard.publication");
    expect(res.status()).toBe(404);
  });

  test("security.txt only exists when a contact is configured", async ({ request }) => {
    const res = await request.get("/.well-known/security.txt");
    if (process.env.SECURITY_CONTACT) {
      expect(res.status()).toBe(200);
      expect(await res.text()).toMatch(/^Contact: /m);
    } else {
      expect(res.status()).toBe(404);
    }
  });
});

test.describe("page metadata", () => {
  for (const route of pages.filter((r) => !r.startsWith("/ticket?"))) {
    test(`${route} has canonical, description and Open Graph tags`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/.+/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
      for (const p of ["og:title", "og:description", "og:image", "og:url", "og:type"]) {
        await expect(page.locator(`meta[property="${p}"]`).first(), p).toHaveAttribute("content", /.+/);
      }
    });
  }

  test("structured data parses and album pages describe their tracks", async ({ page }) => {
    await page.goto("/albums/first-ep");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = blocks.map((b) => JSON.parse(b));
    const album = nodes.find((n) => n["@type"] === "MusicAlbum");
    expect(album.track).toHaveLength(2);
    expect(nodes.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
  });
});
