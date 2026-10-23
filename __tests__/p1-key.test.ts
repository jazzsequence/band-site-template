import { describe, expect, it } from "vitest";

import { getP1ApiKey } from "../lib/site/p1-key";

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
