import { describe, expect, it, vi } from "vitest";

import { isP1Configured } from "../lib/site/p1-config";

const REAL = { CSS_API_KEY: "sat_abc123def456", NEXT_PUBLIC_CSS_SITE_ID: "80040fab-7068-49dd-a12d-4d0b2bc2383d" };

describe("isP1Configured", () => {
  it("is true for a real key and a real site id", () => {
    expect(isP1Configured(REAL)).toBe(true);
  });

  it("is false for the placeholders CI, e2e and local checks use", () => {
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "ci-placeholder" })).toBe(false);
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "e2e-placeholder" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "00000000-0000-0000-0000-000000000000" })).toBe(false);
    expect(isP1Configured({ CSS_API_KEY: "ci-placeholder", NEXT_PUBLIC_CSS_SITE_ID: "00000000-0000-0000-0000-000000000000" })).toBe(false);
  });

  it("judges live by its own published-only key, so a real live build is never disabled", () => {
    const live = { PANTHEON_ENVIRONMENT: "live", NEXT_PUBLIC_CSS_SITE_ID: REAL.NEXT_PUBLIC_CSS_SITE_ID };
    expect(isP1Configured({ ...live, CSS_API_KEY_LIVE: "sat_live_key_123" })).toBe(true);
    expect(isP1Configured({ ...live, CSS_API_KEY: "sat_drafts_key", CSS_API_KEY_LIVE: "" })).toBe(false);
  });

  it("is false when either value is missing, blank or not a UUID", () => {
    expect(isP1Configured({})).toBe(false);
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "x" })).toBe(false);
  });
});

describe("getP1Page with placeholder credentials", () => {
  it("returns null without calling the P1 SDK", async () => {
    const loadPublishedPage = vi.fn();
    vi.resetModules();
    vi.doMock("@pantheon-systems/p1-next-sdk/server", () => ({ loadPublishedPage }));
    vi.stubEnv("CSS_API_KEY", "ci-placeholder");
    vi.stubEnv("NEXT_PUBLIC_CSS_SITE_ID", "00000000-0000-0000-0000-000000000000");
    const { getP1Page } = await import("../lib/site/p1-content");
    expect(await getP1Page("/tour")).toBeNull();
    expect(loadPublishedPage).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.doUnmock("@pantheon-systems/p1-next-sdk/server");
  });
});
