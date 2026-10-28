import { describe, expect, it } from "vitest";

import { applyP1ApiKey, getP1ApiKey } from "../lib/site/p1-key";

describe("getP1ApiKey", () => {
  it("uses the drafts key off live", () => {
    expect(getP1ApiKey({ CSS_API_KEY: "drafts", CSS_API_KEY_LIVE: "published" })).toBe("drafts");
    expect(getP1ApiKey({ PANTHEON_ENVIRONMENT: "dev", CSS_API_KEY: "drafts", CSS_API_KEY_LIVE: "published" })).toBe("drafts");
  });

  it("uses only the published-only key on live, even when the drafts key is set", () => {
    expect(getP1ApiKey({ PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: "drafts", CSS_API_KEY_LIVE: "published" })).toBe("published");
  });

  it("refuses to fall back to the drafts key on live", () => {
    expect(() => getP1ApiKey({ PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: "drafts" })).toThrow(/CSS_API_KEY_LIVE/);
  });
});

// The SDK reads CSS_API_KEY itself, so this is what makes the key choice reach it (at build and at start).
describe("applyP1ApiKey", () => {
  it("puts the published-only key where the SDK reads it on live", () => {
    const env: Record<string, string | undefined> = { PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: "drafts", CSS_API_KEY_LIVE: "published" };
    expect(applyP1ApiKey(env)).toBe("published");
    expect(env.CSS_API_KEY).toBe("published");
    expect(env.CSS_API_KEY_LIVE).toBe("published");
  });

  it("sets it even when CSS_API_KEY is empty on live", () => {
    const env: Record<string, string | undefined> = { PANTHEON_ENVIRONMENT: "live", CSS_API_KEY_LIVE: "published" };
    applyP1ApiKey(env);
    expect(env.CSS_API_KEY).toBe("published");
  });

  it("leaves CSS_API_KEY alone off live", () => {
    const env: Record<string, string | undefined> = { PANTHEON_ENVIRONMENT: "dev", CSS_API_KEY: "drafts", CSS_API_KEY_LIVE: "published" };
    expect(applyP1ApiKey(env)).toBe("drafts");
    expect(env.CSS_API_KEY).toBe("drafts");
  });

  it("throws on live without the live key and does not touch CSS_API_KEY", () => {
    const env: Record<string, string | undefined> = { PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: "drafts" };
    expect(() => applyP1ApiKey(env)).toThrow(/CSS_API_KEY_LIVE/);
    expect(env.CSS_API_KEY).toBe("drafts");
  });
});
