import { describe, expect, it } from "vitest";

import { mediaUrl } from "../lib/site/media-url";

const upload = "https://media.p1.pantheon.io/image/a5773c86-3c93-46ed-9450-8f363b7f0982/assets/8cb57e31/50d87cbb-hero.jpg";

describe("mediaUrl", () => {
  it("asks P1 media for the width, keeping what the URL already says", () => {
    expect(mediaUrl(`${upload}?fit=scale-down`, 1200)).toBe(`${upload}?fit=scale-down&width=1200`);
    expect(mediaUrl(upload, 800)).toBe(`${upload}?width=800`);
  });

  it("does the same on the host media redirects to", () => {
    const files = "https://pantheon-files.com/image/a5773c86/assets/8cb57e31/x.jpg?fit=scale-down";
    expect(mediaUrl(files, 1000)).toBe(`${files}&width=1000`);
  });

  it("leaves a width someone already chose", () => {
    const url = `${upload}?fit=scale-down&width=400`;
    expect(mediaUrl(url, 1600)).toBe(url);
  });

  it("leaves anything that is not P1 media alone", () => {
    for (const url of ["/images/band-bw.jpg", "/images/band-bw.jpg?v=abc", "https://example.com/photo.jpg", "http://media.p1.pantheon.io/x.jpg", "not a url"]) {
      expect(mediaUrl(url, 1200)).toBe(url);
    }
  });

  it("returns an empty string for no URL", () => {
    expect(mediaUrl(undefined, 1200)).toBe("");
    expect(mediaUrl("", 1200)).toBe("");
  });
});
