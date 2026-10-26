import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { buildP1Pages, describeP1Pages, p1PagesProblem, readRepoContent, withoutTour, type Block, type P1PageInput, type PageDoc } from "../lib/init/p1-pages";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf-8");
const doc = (title: string, content: Block[] = []): PageDoc => ({ path: "/x", root: { props: { title, description: `${title} description` } }, content });

// A band that is not the placeholder, so nothing here depends on the repo's own content.
const input = (over: Partial<P1PageInput> = {}): P1PageInput => ({
  band: { name: "Cinder & Vale", description: "A duo." },
  features: { tour: true, merch: true, lyrics: true, map: true, press: true },
  albums: [
    { slug: "ash", title: "Ash", featured: false },
    { slug: "embers", title: "Embers", featured: true, gallery: [{ src: "/images/back.png", alt: "Back cover" }, { src: "/images/inner.png", alt: "Inner" }] },
  ],
  shows: [{ id: "a-2027-01-01", date: "2027-01-01", city: "Denver, CO", venue: "Hall", address: "1 Main St", doors: "8 PM", price: 20, status: "on-sale", lat: 1, lon: 2, secret: "not a show field" }],
  merch: [{ name: "Tee", price: "$25", image: "/images/tee.png" }],
  pressArticle: "## **A Title**\n\n### ***A standfirst.***\n\nBody text.\n",
  fixtures: {
    home: doc("Home", [
      { type: "HeroBlock", props: { id: "HeroBlock-1", title: "Old", actions: [{ label: "Tour dates", href: "/tour" }, { label: "Listen", href: "/listen" }] } },
      { type: "TourPreviewBlock", props: { id: "TourPreviewBlock-2" } },
      { type: "AlbumGridBlock", props: { id: "AlbumGridBlock-3" } },
    ]),
    albums: doc("Albums", [{ type: "AlbumGridBlock", props: { id: "AlbumGridBlock-4" } }]),
    lyrics: doc("Lyrics", [{ type: "LyricsIndexBlock", props: { id: "LyricsIndexBlock-5" } }]),
    privacy: doc("Privacy", [{ type: "ArticleBlock", props: { id: "ArticleBlock-6", markdown: "# Privacy" } }]),
  },
  ...over,
});
const byPath = (pages: ReturnType<typeof buildP1Pages>) => Object.fromEntries(pages.map((p) => [p.path, p]));

describe("buildP1Pages", () => {
  it("makes a page for every route, one per album, with P1's document paths", () => {
    const pages = buildP1Pages(input());
    expect(pages.map((p) => p.path)).toEqual(["/", "/albums", "/albums/ash", "/albums/embers", "/listen", "/lyrics", "/tour", "/merch", "/bio", "/press", "/privacy"]);
    expect(pages.map((p) => p.documentPath)).toEqual(["/", "albums", "albums/ash", "albums/embers", "listen", "lyrics", "tour", "merch", "bio", "press", "privacy"]);
  });

  it("leaves out the sections that are switched off, and the tour button with them", () => {
    const pages = byPath(buildP1Pages(input({ features: { tour: false, merch: false, lyrics: false, map: false, press: false } })));
    for (const gone of ["/tour", "/merch", "/lyrics", "/press"]) expect(pages, gone).not.toHaveProperty([gone]);
    expect(pages["/"].components.map((c) => c.type)).not.toContain("TourPreviewBlock");
    expect((pages["/"].components[0].props.actions as { href: string }[]).map((a) => a.href)).toEqual(["/listen"]);
    expect(pages["/bio"].components[0].props).not.toHaveProperty("ctaHref");
    for (const kept of ["/", "/albums", "/albums/ash", "/listen", "/bio", "/privacy"]) expect(pages, kept).toHaveProperty([kept]);
  });

  it("names the featured album in the home hero, as the code version does", () => {
    expect(byPath(buildP1Pages(input()))["/"].components[0].props.title).toBe("Embers");
    const none = input({ albums: [{ slug: "ash", title: "Ash" }] });
    expect(byPath(buildP1Pages(none))["/"].components[0].props.title).toBe("Ash");
  });

  it("builds each album's page, with its gallery only when it has one", () => {
    const pages = byPath(buildP1Pages(input()));
    expect(pages["/albums/ash"].components.map((c) => c.type)).toEqual(["AlbumHeaderBlock", "TrackListBlock"]);
    const embers = pages["/albums/embers"].components;
    expect(embers.map((c) => c.type)).toEqual(["AlbumHeaderBlock", "TrackListBlock", "ImageGalleryBlock"]);
    expect(embers[0].props).toMatchObject({ albumSlug: "embers" });
    expect(embers[2].props).toEqual({ columns: "2", items: [{ imageUrl: "/images/back.png", alt: "Back cover" }, { imageUrl: "/images/inner.png", alt: "Inner" }] });
    expect(byPath(buildP1Pages(input()))["/listen"].components.filter((c) => c.type === "AlbumSectionBlock").map((c) => c.props.albumSlug)).toEqual(["ash", "embers"]);
  });

  it("carries the band's own shows and merch, and only the fields the blocks have", () => {
    const pages = byPath(buildP1Pages(input()));
    const items = pages["/tour"].components[1].props.items as Record<string, unknown>[];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "a-2027-01-01", city: "Denver, CO", status: "on-sale", price: 20 });
    expect(items[0]).not.toHaveProperty("secret");
    expect(pages["/merch"].components[1].props.items).toEqual([{ name: "Tee", price: "$25", imageUrl: "/images/tee.png" }]);
  });

  it("builds the bio from the text it is given, and says when it only has the description", () => {
    const withBio = byPath(buildP1Pages(input({ bio: "Two people, one van." })))["/bio"];
    expect(withBio.components[0].props).toMatchObject({ body: "Two people, one van.", title: "Cinder & Vale", titleLevel: "h1" });
    expect(withBio.notes).toEqual([]);
    const without = byPath(buildP1Pages(input()))["/bio"];
    expect(without.components[0].props.body).toBe("A duo.");
    expect(without.notes[0]).toMatch(/only the band description/);
  });

  it("turns the press article into the page's heading, standfirst and metadata", () => {
    const press = byPath(buildP1Pages(input()))["/press"];
    expect(press.title).toBe("A Title");
    expect(press.description).toBe("A standfirst.");
    expect(press.components[0].props.markdown).toBe("# A Title\n\n*A standfirst.*\n\nBody text.");
  });

  it("never sends a page id (P1 assigns them) and only uses blocks the site registers", () => {
    const registered = new Set([...read("puck.config.tsx").matchAll(/^\s{4}(\w+Block):/gm)].map((m) => m[1]));
    expect(registered.size).toBeGreaterThan(10);
    for (const page of buildP1Pages(input())) {
      for (const c of page.components) {
        expect(c.props, `${page.path} ${c.type}`).not.toHaveProperty("id");
        expect(registered.has(c.type), `${c.type} is not registered in puck.config.tsx`).toBe(true);
      }
    }
  });
});

describe("p1PagesProblem", () => {
  it("refuses a repo that is still the placeholder band, or has no P1 site recorded", () => {
    expect(p1PagesProblem({ setup: { initialized: false }, hosting: { p1SiteId: "abc12345" } })).toMatch(/still the placeholder band/);
    expect(p1PagesProblem({})).toMatch(/still the placeholder band/);
    expect(p1PagesProblem({ setup: { initialized: true }, hosting: {} })).toMatch(/hosting\.p1SiteId/);
    expect(p1PagesProblem({ setup: { initialized: true }, hosting: { p1SiteId: "abc12345" } })).toBeNull();
  });
});

describe("describeP1Pages", () => {
  it("lists where each page goes and what is on it, and what is still the person's to supply", () => {
    const text = describeP1Pages("site-1", buildP1Pages(input()));
    expect(text).toContain("P1 site site-1: 11 pages to create");
    expect(text).toMatch(/^ {2}albums\/embers\s+Embers {2}\[AlbumHeader, TrackList, ImageGallery\]$/m);
    expect(text).toMatch(/^ {2}\/ {24}Cinder & Vale {2}\[Hero, TourPreview, AlbumGrid\]$/m);
    expect(text).toContain("Still yours to supply:\n- /bio: The bio page carries only the band description");
    expect(describeP1Pages("site-1", buildP1Pages(input({ bio: "Text." })))).not.toContain("Still yours to supply");
  });
});

describe("withoutTour", () => {
  it("drops the tour list and the hero's Tour dates button, and nothing else", () => {
    const out = withoutTour([
      { type: "HeroBlock", props: { title: "T", actions: [{ href: "/tour" }, { href: "/listen" }] } },
      { type: "TourPreviewBlock", props: {} },
      { type: "AlbumGridBlock", props: {} },
    ]);
    expect(out.map((b) => b.type)).toEqual(["HeroBlock", "AlbumGridBlock"]);
    expect(out[0].props).toEqual({ title: "T", actions: [{ href: "/listen" }] });
  });
});

// The fixtures in content/p1-pages/ are the designed pages; the builder must reproduce them from the same data. They describe the
// placeholder band, so in a repo that has been set up for a real band there is nothing to compare against.
const isTemplate = JSON.parse(read("band.config.json")).setup?.initialized === false;
describe.skipIf(!isTemplate)("the designed fixtures in content/p1-pages (template state)", () => {
  const pages = byPath(buildP1Pages(readRepoContent(root, undefined)));
  const strip = (blocks: Block[]) => blocks.map(({ type, props }) => ({ type, props: Object.fromEntries(Object.entries(props).filter(([k]) => k !== "id")) }));
  const fixtures: [string, string][] = [
    ["/", "home"],
    ["/albums", "albums"],
    ["/albums/debut", "albums-debut"],
    ["/albums/first-ep", "albums-first-ep"],
    ["/albums/unreleased", "albums-unreleased"],
    ["/listen", "listen"],
    ["/lyrics", "lyrics"],
    ["/press", "press"],
    ["/privacy", "privacy"],
  ];

  it.each(fixtures)("reproduces %s from content/p1-pages/%s.json", (route, name) => {
    const fixture = JSON.parse(read(`content/p1-pages/${name}.json`)) as PageDoc;
    expect(pages[route], `no page built for ${route}`).toBeTruthy();
    expect(pages[route].components).toEqual(strip(fixture.content));
    if (route !== "/") expect(pages[route].title).toBe(fixture.root.props.title);
  });
});
