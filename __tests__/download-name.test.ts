import { describe, expect, it } from "vitest";

import { band } from "../lib/band/config";
import { downloadFilename, fileSafe } from "../lib/site/download-name";
import { albums } from "../lib/site/catalog";

describe("downloadFilename", () => {
  it("keeps non-Latin titles instead of stripping them", () => {
    expect(downloadFilename("夜明け", ".m4a")).toBe(`${fileSafe(band.name)} - 夜明け.m4a`);
  });

  it("keeps Latin titles readable (apostrophes stay, brackets go)", () => {
    expect(downloadFilename("Don’t Ask What I Am (v2)", ".m4a")).toBe(`${fileSafe(band.name)} - Don’t Ask What I Am v2.m4a`);
    expect(downloadFilename("Hold still", ".m4a")).toBe(`${fileSafe(band.name)} - Hold still.m4a`);
  });

  it("removes characters that are unsafe in file names", () => {
    expect(downloadFilename('a/b:c*d?"e<f>g|h', ".m4a")).toBe(`${fileSafe(band.name)} - abcdefgh.m4a`);
  });

  it("never produces an empty name for any track in the catalogue", () => {
    for (const album of albums) {
      for (const t of album.tracks) {
        expect(downloadFilename(t.title, ".m4a"), `${album.slug}/${t.slug}`).not.toBe(`${fileSafe(band.name)} - .m4a`);
      }
    }
  });
});
