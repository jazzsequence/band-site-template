import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteDataProvider } from "../components/site/site-data";
import albums from "../data/albums.json";
import { getCatalog } from "../lib/site/catalog";
import { getLyrics } from "../lib/site/lyrics";
import type { SiteData } from "../lib/site/site-data";
import { shows } from "../lib/site/tour";
import config from "../puck.config";

const FIXTURES = path.join(process.cwd(), "content", "p1-pages");
const pages = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, doc: JSON.parse(readFileSync(path.join(FIXTURES, f), "utf8")) as { path: string; content: { type: string; props: Record<string, unknown> }[] } }));

/** Site data from the repo copy only: the real loader asks P1, which cannot run outside a request. */
async function getSiteData(): Promise<SiteData> {
  const lyrics = await getLyrics();
  return { albums: await getCatalog(), shows, lyrics: lyrics.map(({ slug, title, album, track }) => ({ slug, title, album, track })) };
}

const components = config.components as Record<string, { render: (p: never) => React.ReactElement; defaultProps?: object }>;

describe("the P1 page definitions", () => {
  it("only use blocks that are registered", () => {
    for (const { file, doc } of pages) for (const b of doc.content) expect(components[b.type], `${file}: unknown block ${b.type}`).toBeDefined();
  });

  it("only point at albums that exist in the catalog", () => {
    const slugs = new Set(albums.map((a) => a.slug));
    for (const { file, doc } of pages) for (const b of doc.content) if (typeof b.props.albumSlug === "string") expect(slugs.has(b.props.albumSlug), `${file}: ${b.props.albumSlug}`).toBe(true);
  });

  it("each have exactly one block that supplies the page's h1", () => {
    const h1 = new Set(["HeroBlock", "PageHeadingBlock", "AlbumHeaderBlock", "ArticleBlock"]);
    for (const { file, doc } of pages) expect(doc.content.filter((b) => h1.has(b.type)).length, file).toBe(1);
  });
});

describe("blocks", () => {
  it("every block renders from its default props without throwing", async () => {
    const site = await getSiteData();
    for (const [name, block] of Object.entries(components)) {
      if (!name.endsWith("Block") || ["P1WelcomeBlock", "DataListBlock"].includes(name)) continue;
      expect(() => renderToStaticMarkup(<SiteDataProvider initial={site}>{block.render((block.defaultProps ?? {}) as never)}</SiteDataProvider>), name).not.toThrow();
    }
  });

  it("catalog blocks show the catalog's own data", async () => {
    const site = await getSiteData();
    const html = (name: string, props: object) => renderToStaticMarkup(<SiteDataProvider initial={site}>{components[name].render(props as never)}</SiteDataProvider>);
    const ep = html("TrackListBlock", { albumSlug: "ep", heading: "Track list" });
    expect(ep).toContain("Consent of the Quiet (v1)");
    expect(ep).toContain("Outlast");
    expect(html("AlbumHeaderBlock", { albumSlug: "tribute", kicker: "" })).toContain(">Tribute<");
    expect(html("LyricsIndexBlock", {})).toContain("/lyrics/say-when");
    expect(html("AlbumGridBlock", { headingLevel: "h2", includeUnreleased: "no" })).not.toContain("Unreleased");
    expect(html("TourPreviewBlock", { count: 2, heading: "Tour", kicker: "", linkLabel: "", linkHref: "" }).match(/Get tickets|Sold out/g)?.length).toBe(2);
  });

  it("an unknown album says so instead of crashing", async () => {
    const site = await getSiteData();
    const out = renderToStaticMarkup(<SiteDataProvider initial={site}>{components.TrackListBlock.render({ albumSlug: "nope" } as never)}</SiteDataProvider>);
    expect(out).toContain("check the Album choice");
  });

  it("show a loading state while the editor fetches the catalog", () => {
    const out = renderToStaticMarkup(<SiteDataProvider>{components.AlbumGridBlock.render({} as never)}</SiteDataProvider>);
    expect(out).toContain("Loading albums");
  });
});
