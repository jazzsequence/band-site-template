import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import config from "../puck.config";

/**
 * Storybook is where components are designed and approved; P1 is where pages are built. Every component in
 * the design system must say how it reaches a page: through a P1 block, or why it deliberately does not. A new
 * component fails this test until someone decides, so the two cannot drift apart.
 */
type Entry = { blocks: string[] } | { excluded: string };

const COVERAGE: Record<string, Entry> = {
  AlbumCard: { blocks: ["AlbumGridBlock"] },
  AppLink: { excluded: "Infrastructure: client-side links used inside the other components." },
  Button: { blocks: ["HeroBlock", "ButtonRowBlock", "AlbumHeaderBlock", "TourPreviewBlock", "ImageTextBlock"] },
  Hero: { blocks: ["HeroBlock"] },
  LightboxImage: { blocks: ["ImageTextBlock", "ImageGalleryBlock", "MerchGridBlock", "AlbumHeaderBlock", "AlbumSectionBlock"] },
  LyricsBlock: { excluded: "Per-song lyrics pages are one code route that reads Markdown (decided with the owner)." },
  MerchCard: { blocks: ["MerchGridBlock"] },
  PlayerBar: { excluded: "Part of the site layout, so the player follows the visitor across pages." },
  SectionHeading: { blocks: ["PageHeadingBlock", "SectionHeadingBlock", "TourPreviewBlock"] },
  SiteFooter: { excluded: "Part of the site layout." },
  SiteHeader: { excluded: "Part of the site layout." },
  TicketCard: { excluded: "The demonstration checkout and e-ticket are application pages, not editable content." },
  TourMap: { blocks: ["TourDatesBlock"] }, // also placed by the ticket page; loads OpenStreetMap tiles only on request (see the Privacy page)
  TourMapCanvas: { excluded: "Internal to TourMap: the lazy-loaded MapLibre canvas." },
  TourDateRow: { blocks: ["TourDatesBlock", "TourPreviewBlock"] },
  TrackRow: { blocks: ["TrackListBlock", "AlbumSectionBlock"] },
  Wordmark: { excluded: "Part of the site layout; the name is never typed into content." },
};

const dir = path.join(process.cwd(), "design-system", "components");
const components = readdirSync(dir)
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".stories.tsx"))
  .map((f) => f.replace(/\.tsx$/, ""));

describe("design system to P1 coverage", () => {
  it("every design-system component has a decision", () => {
    expect(components.filter((c) => !(c in COVERAGE)), "add these to COVERAGE in this test").toEqual([]);
  });

  it("has no decision for a component that no longer exists", () => {
    expect(Object.keys(COVERAGE).filter((c) => !components.includes(c))).toEqual([]);
  });

  it("every block it points at is registered in the editor", () => {
    const registered = config.components as Record<string, unknown>;
    for (const [name, entry] of Object.entries(COVERAGE)) {
      if ("blocks" in entry) for (const b of entry.blocks) expect(registered[b], `${name} -> ${b}`).toBeDefined();
    }
  });

  it("every PARIS block is offered in the editor's PARIS category", () => {
    const offered = (config.categories as { paris: { components: string[] } }).paris.components;
    const registered = Object.keys(config.components as object).filter((k) => offered.includes(k));
    expect(registered.sort()).toEqual([...offered].sort());
  });
});
