import { afterEach, describe, expect, it, vi } from "vitest";

/** The version is read once at import, as it is inlined once per build, so each case reloads the module. */
async function load(version: string | undefined) {
  vi.resetModules();
  if (version === undefined) vi.stubEnv("NEXT_PUBLIC_ASSET_VERSION", "");
  else vi.stubEnv("NEXT_PUBLIC_ASSET_VERSION", version);
  return (await import("../design-system/asset")).assetUrl;
}

describe("assetUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("versions local images so a stale cached miss cannot stick", async () => {
    const assetUrl = await load("abc123");
    expect(assetUrl("/images/merch/tour-tee.jpg")).toBe("/images/merch/tour-tee.jpg?v=abc123");
  });

  it("leaves other URLs alone", async () => {
    const assetUrl = await load("abc123");
    expect(assetUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(assetUrl("images/relative.jpg")).toBe("images/relative.jpg"); // Storybook-style relative path
    expect(assetUrl("/icons/icon-192.png")).toBe("/icons/icon-192.png");
    expect(assetUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });

  it("does not double-version a URL that already has a query", async () => {
    const assetUrl = await load("abc123");
    expect(assetUrl("/images/a.jpg?v=1")).toBe("/images/a.jpg?v=1");
  });

  it("is a no-op when no version is set (Storybook)", async () => {
    const assetUrl = await load(undefined);
    expect(assetUrl("/images/a.jpg")).toBe("/images/a.jpg");
  });
});
