import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ doc: null as unknown }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("../lib/site/p1-content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/site/p1-content")>()),
  getP1Page: async () => state.doc,
}));
vi.mock("../components/site/p1-page", () => ({ P1Page: () => null }));

import PressKitRoute, { generateMetadata, revalidate } from "../app/(site)/press/kit/page";

const doc = { root: { props: { title: "Press Kit", description: "Everything press needs." } }, content: [] };

beforeEach(() => {
  state.doc = doc;
});

describe("the /press/kit route", () => {
  it("renders the published P1 page", async () => {
    const element = (await PressKitRoute()) as { props: { data: unknown; path: string } };
    expect(element.props.path).toBe("/press/kit");
    expect(element.props.data).toBe(doc);
  });

  it("is a 404 when the page is not published in P1", async () => {
    state.doc = null;
    await expect(PressKitRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("does not look at the pressKit switch: that only drops the sitemap, llms.txt and footer entries, and unpublishing in P1 takes the page down", () => {
    expect(readFileSync(new URL("../app/(site)/press/kit/page.tsx", import.meta.url), "utf-8")).not.toMatch(/features\.pressKit/);
  });

  it("has a canonical URL, og:url, og:image and a large Twitter card, with the title and description published in P1", async () => {
    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toBe("/press/kit");
    expect(meta.openGraph?.url).toBe("/press/kit");
    expect(JSON.stringify(meta.openGraph?.images)).toContain("/og-default.jpg");
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.description).toBe("Everything press needs.");
    expect(String(meta.openGraph?.title)).toContain("Press Kit");
  });

  it("falls back to its own title and description before anything is published", async () => {
    state.doc = null;
    const meta = await generateMetadata();
    expect(meta.title).toBe("Press kit");
    expect(String(meta.description)).toMatch(/^Bios, quick facts, photos and artwork for /);
  });

  it("is refreshed on the same five-minute window as the other P1 pages", () => {
    expect(revalidate).toBe(300);
  });
});
