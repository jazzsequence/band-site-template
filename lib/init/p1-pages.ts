/**
 * The P1 pages for a band's site, built from the band's own repo content, ready for the P1 MCP's `create_page`.
 *
 * Every public page can be a P1 page (CONTENT.md): P1 renders it when one is published, and the repo version is the fallback. So a
 * finished site has a P1 page for each route, and these are the definitions. They mirror the code versions under app/(site)/ and the
 * designed fixtures in content/p1-pages/, and __tests__/init-p1-pages.test.ts proves it against those fixtures.
 *
 * Pure: it reads nothing and creates nothing. The caller loads the repo (readRepoContent) and the skill sends the result to P1, only
 * after the person has said yes to the exact list. Page ids are left out (P1 assigns them).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import type { Feature } from "../band/config";

export type Block = { type: string; props: Record<string, unknown> };
/** A page as content/p1-pages/*.json holds it. */
export type PageDoc = { path: string; root: { props: { title: string; description: string } }; content: Block[] };

export type Album = {
  slug: string;
  title: string;
  featured?: boolean;
  gallery?: { src: string; alt: string }[];
};

export type P1PageInput = {
  band: { name: string; description: string };
  features: Record<Feature, boolean>;
  albums: Album[];
  shows: Record<string, unknown>[];
  merch: { name: string; price: string; image: string }[];
  /** content/press/article.md */
  pressArticle: string;
  /** The band's biography as Markdown. Absent: the page carries the band description alone, and says so. */
  bio?: string;
  /** The designed pages that do not depend on the band's content: home, albums, lyrics, privacy. */
  fixtures: Record<"home" | "albums" | "lyrics" | "privacy", PageDoc>;
};

export type P1PageSpec = {
  /** The route: "/", "/albums/debut". */
  path: string;
  /** What P1's create_page and get_document call it: "/" for the home page, otherwise the route without its leading slash. */
  documentPath: string;
  title: string;
  description: string;
  components: Block[];
  /** Things the person still has to supply, in plain words. */
  notes: string[];
};

const withoutId = (blocks: Block[]): Block[] =>
  blocks.map(({ type, props }) => ({ type, props: Object.fromEntries(Object.entries(props).filter(([k]) => k !== "id")) }));

/** The home page without the tour list and the hero's Tour dates button, for a band with no tour section. Shared with /init-band's apply. */
export function withoutTour(blocks: Block[]): Block[] {
  return blocks
    .filter((b) => b.type !== "TourPreviewBlock")
    .map((b) =>
      b.type === "HeroBlock" ? { ...b, props: { ...b.props, actions: ((b.props.actions as { href?: string }[] | undefined) ?? []).filter((a) => a.href !== "/tour") } } : b,
    );
}

const SHOW_KEYS = ["id", "date", "city", "venue", "address", "capacity", "doors", "price", "status", "lat", "lon"];

/** The article the way the P1 page carries it: its level-2 title becomes the level-1 heading and its level-3 line the italic standfirst. */
function pressPage(md: string): { title: string; description: string; markdown: string } {
  const lines = md.split("\n");
  const h2 = lines.findIndex((l) => /^##\s/.test(l));
  const h3 = lines.findIndex((l) => /^###\s/.test(l));
  const plain = (l: string) => l.replace(/^#+\s*/, "").replace(/[*_]/g, "").trim();
  const title = h2 >= 0 ? plain(lines[h2]) : "Press";
  const description = h3 >= 0 ? plain(lines[h3]) : "";
  const markdown = lines.map((l, i) => (i === h2 ? `# ${title}` : i === h3 ? `*${description}*` : l)).join("\n").trimEnd();
  return { title, description, markdown };
}

export function buildP1Pages(input: P1PageInput): P1PageSpec[] {
  const { band, features, albums, fixtures } = input;
  const featured = albums.find((a) => a.featured) ?? albums[0];
  const pages: P1PageSpec[] = [];
  const add = (route: string, title: string, description: string, components: Block[], notes: string[] = []) =>
    pages.push({ path: route, documentPath: route === "/" ? "/" : route.slice(1), title, description, components: withoutId(components), notes });
  const fixture = (key: keyof P1PageInput["fixtures"]) => fixtures[key].content;

  // Home: the designed page, with the hero naming the featured album (the code version does the same) and no tour when it is off.
  const home = (features.tour ? fixture("home") : withoutTour(fixture("home"))).map((b) =>
    b.type === "HeroBlock" && featured ? { ...b, props: { ...b.props, title: featured.title } } : b,
  );
  add("/", band.name, band.description, home);

  add("/albums", fixtures.albums.root.props.title, fixtures.albums.root.props.description, fixture("albums"));
  for (const a of albums) {
    const blocks: Block[] = [
      { type: "AlbumHeaderBlock", props: { albumSlug: a.slug, kicker: "", actions: [{ label: "All albums", href: "/albums", style: "outline" }] } },
      { type: "TrackListBlock", props: { albumSlug: a.slug, heading: "Track list" } },
    ];
    if (a.gallery?.length) blocks.push({ type: "ImageGalleryBlock", props: { columns: "2", items: a.gallery.map((g) => ({ imageUrl: g.src, alt: g.alt })) } });
    add(`/albums/${a.slug}`, a.title, "", blocks);
  }

  add("/listen", "Listen", "Stream and download every album, EP and unreleased recording.", [
    { type: "PageHeadingBlock", props: { kicker: "Music", title: "Listen", intro: "" } },
    ...albums.map((a) => ({ type: "AlbumSectionBlock", props: { albumSlug: a.slug } })),
  ]);

  if (features.lyrics) add("/lyrics", fixtures.lyrics.root.props.title, fixtures.lyrics.root.props.description, fixture("lyrics"));

  if (features.tour) {
    add("/tour", "Tour", "Live: tour dates, venues and tickets.", [
      { type: "PageHeadingBlock", props: { kicker: "Live", title: "Tour dates", intro: "" } },
      { type: "TourDatesBlock", props: { items: input.shows.map((s) => Object.fromEntries(Object.entries(s).filter(([k]) => SHOW_KEYS.includes(k)))) } },
    ]);
  }

  if (features.merch) {
    add("/merch", "Merch", "Merchandise, sold at the merch table on tour.", [
      { type: "PageHeadingBlock", props: { kicker: "Take something home", title: "Merch", intro: "Everything here is sold at the merch table on tour. Online orders are not open yet." } },
      { type: "MerchGridBlock", props: { items: input.merch.map((m) => ({ name: m.name, price: m.price, imageUrl: m.image })) } },
    ]);
  }

  add(
    "/bio",
    "Bio",
    band.description,
    [
      {
        type: "ImageTextBlock",
        props: {
          imageUrl: "/images/band-portrait.png",
          imageAlt: `${band.name}, portrait`,
          imageSide: "left",
          kicker: "About",
          title: band.name,
          titleLevel: "h1",
          body: input.bio ?? band.description,
          ...(features.tour ? { ctaLabel: "Tour dates", ctaHref: "/tour" } : {}),
        },
      },
    ],
    input.bio ? [] : ["The bio page carries only the band description: write the biography and rebuild it, or edit it in P1."],
  );

  if (features.press) {
    const press = pressPage(input.pressArticle);
    add("/press", press.title, press.description, [{ type: "ArticleBlock", props: { kicker: "", markdown: press.markdown } }]);
  }

  add("/privacy", fixtures.privacy.root.props.title, fixtures.privacy.root.props.description, fixture("privacy"));
  return pages;
}

/** Why pages cannot be built for this repo yet, or null when they can. */
export function p1PagesProblem(config: { setup?: { initialized?: boolean }; hosting?: { p1SiteId?: string } }): string | null {
  if (!config.setup?.initialized) return "This repo is still the placeholder band: run /init-band first, and replace the sample albums, shows and copy with the band's own.";
  if (!config.hosting?.p1SiteId) return "No P1 site is recorded (hosting.p1SiteId in band.config.json): create or choose the band's P1 site and re-run the hosting questions first.";
  return null;
}

/** The pages as the person reads them before saying yes: where each goes, what is on it, and what is still theirs to supply. */
export function describeP1Pages(siteId: string, pages: P1PageSpec[]): string {
  const rows = pages.map((p) => `  ${p.documentPath.padEnd(24)} ${p.title}  [${p.components.map((c) => c.type.replace(/Block$/, "")).join(", ")}]`);
  const notes = pages.flatMap((p) => p.notes.map((n) => `- ${p.path}: ${n}`));
  return [`P1 site ${siteId}: ${pages.length} pages to create (document path, title, blocks)`, ...rows, ...(notes.length ? ["", "Still yours to supply:", ...notes] : [])].join("\n");
}

/** Loads what buildP1Pages needs from a repo checkout. */
export function readRepoContent(root: string, bio?: string): P1PageInput {
  const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");
  const json = <T>(rel: string) => JSON.parse(read(rel)) as T;
  const config = json<{ band: P1PageInput["band"]; features: P1PageInput["features"] }>("band.config.json");
  const doc = (name: string) => json<PageDoc>(`content/p1-pages/${name}.json`);
  return {
    band: { name: config.band.name, description: config.band.description },
    features: config.features,
    albums: json<Album[]>("data/albums.json"),
    shows: json<Record<string, unknown>[]>("data/tour.json"),
    merch: json<P1PageInput["merch"]>("data/merch.json"),
    pressArticle: read("content/press/article.md"),
    ...(bio !== undefined ? { bio } : {}),
    fixtures: { home: doc("home"), albums: doc("albums"), lyrics: doc("lyrics"), privacy: doc("privacy") },
  };
}
