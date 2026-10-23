import { afterEach, describe, expect, it, vi } from "vitest";

import { listAudioKeys } from "../lib/site/audio";
import { albums, audioFile, audioKey, getCatalog } from "../lib/site/catalog";
import { getLyric, getLyrics, parseLyric } from "../lib/site/lyrics";
import { dateParts, getShow, longDate, shows } from "../lib/site/tour";

describe("lyrics", () => {
  it("parses frontmatter and labelled sections", () => {
    const l = parseLyric("x", '---\ntitle: "X"\nalbum: a\ntrack: 3\n---\n\n### Verse 1\nline one\nline two\n\n### Chorus\nhey\n');
    expect(l).toMatchObject({ title: "X", album: "a", track: 3 });
    expect(l.sections.map((s) => s.label)).toEqual(["Verse 1", "Chorus"]);
    expect(l.sections[0].lines).toEqual(["line one", "line two"]);
  });

  it("keeps repeated labels as separate sections", () => {
    const l = parseLyric("x", "### Chorus\na\n\n### Chorus\nb\n");
    expect(l.sections).toHaveLength(2);
  });

  it("rejects unsafe slugs", async () => {
    expect(await getLyric("../package")).toBeUndefined();
    expect(await getLyric("does-not-exist")).toBeUndefined();
  });

  it("parses a seeded lyric with its labelled sections", async () => {
    const l = await getLyric("first-song");
    expect(l).toMatchObject({ title: "First Song", album: "debut", track: 1 });
    expect(l?.sections.map((x) => x.label)).toEqual(["Verse 1", "Chorus"]);
  });

  it("loads every seeded lyric", async () => {
    const all = await getLyrics();
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.every((l) => l.sections.length > 0)).toBe(true);
  });
});

describe("catalog", () => {
  it("names audio files <NN>-<slug>.m4a", () => {
    const t = { number: 3, slug: "third-song", title: "x" };
    expect(audioFile(t)).toBe("03-third-song.m4a");
    expect(audioKey("debut", t)).toBe("debut/03-third-song.m4a");
  });

  it("has a lyric for every track that claims one", async () => {
    const catalog = await getCatalog();
    const lyrics = new Set((await getLyrics()).map((l) => l.slug));
    for (const a of catalog) for (const t of a.tracks) expect(t.hasLyrics).toBe(lyrics.has(t.slug));
  });

  it("has exactly one featured album, and unreleased material has no year", () => {
    expect(albums.filter((a) => a.featured)).toHaveLength(1);
    expect(albums.find((a) => a.slug === "unreleased")?.year).toBeUndefined();
  });
});

describe("audio bucket listing", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("treats every track as unavailable when credentials are missing", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    expect((await listAudioKeys()).size).toBe(0);
  });
});

describe("tour", () => {
  it("is sorted by date and has unique ids", () => {
    expect(shows.map((s) => s.date)).toEqual([...shows.map((s) => s.date)].sort());
    expect(new Set(shows.map((s) => s.id)).size).toBe(shows.length);
  });

  it("formats dates without timezone drift", () => {
    expect(dateParts("2027-03-12")).toEqual({ month: "MAR", day: "12", year: 2027 });
    expect(longDate("2027-03-12")).toBe("Friday, March 12, 2027");
  });

  it("seeds one on-sale and one sold-out placeholder date, so both ticket pages can be exercised", () => {
    expect(shows.map((s) => s.status)).toEqual(["on-sale", "sold-out"]);
    expect(getShow(shows[1].id)?.venue).toBe("Placeholder Theatre");
  });
});
