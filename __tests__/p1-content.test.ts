import { describe, expect, it } from "vitest";

import { findBlockProps, rootProp } from "../lib/site/p1-content";
import { normalizeShows, showId } from "../lib/site/tour";

describe("showId", () => {
  it("keeps an explicit id so existing ticket links survive edits", () => {
    expect(showId({ id: "sample-city-2027-03-12", city: "Sample City, CA", date: "2027-03-12" })).toBe("sample-city-2027-03-12");
  });
  it("derives a stable id for new dates", () => {
    expect(showId({ city: "Salt Lake City, UT", date: "2027-04-06" })).toBe("salt-lake-city-2027-04-06");
  });
});

describe("normalizeShows (untrusted editor input)", () => {
  const good = { date: "2027-03-18", city: "Sample Town, OR", venue: "Placeholder Theatre", doors: "7:00 PM", price: 28.5, status: "on-sale", lat: 37.8, lon: -122.27 };

  it("sorts by date and fills ids", () => {
    const rows = normalizeShows([{ ...good, date: "2027-03-18" }, { ...good, date: "2027-03-07", city: "Sample City, CA", venue: "Example Hall" }]);
    expect(rows.map((r) => r.date)).toEqual(["2027-03-07", "2027-03-18"]);
    expect(rows[0].id).toBe("sample-city-2027-03-07");
  });

  it("drops rows missing a valid date, city or venue instead of rendering broken ones", () => {
    expect(normalizeShows([{ ...good, date: "Oct 18" }, { ...good, city: "" }, { ...good, venue: " " }, null, "x", 3])).toEqual([]);
  });

  it("coerces bad numbers and statuses to safe defaults", () => {
    const [row] = normalizeShows([{ ...good, price: "free", status: "cancelled", lat: "north", doors: "" }]);
    expect(row).toMatchObject({ price: 0, status: "on-sale", lat: 0, doors: "TBA" });
  });

  it("returns nothing for non-arrays", () => {
    expect(normalizeShows(undefined)).toEqual([]);
    expect(normalizeShows({})).toEqual([]);
  });
});

describe("findBlockProps", () => {
  const data = {
    root: { props: { title: " Tour ", description: "" } },
    content: [{ type: "PageHeadingBlock", props: { title: "Tour" } }],
    zones: { "col:0": [{ type: "TourDatesBlock", props: { items: [{ city: "x" }] } }] },
  } as never;

  it("finds blocks at the top level and inside zones", () => {
    expect(findBlockProps(data, "PageHeadingBlock")).toEqual({ title: "Tour" });
    expect(findBlockProps(data, "TourDatesBlock")?.items).toHaveLength(1);
    expect(findBlockProps(data, "Nope")).toBeUndefined();
    expect(findBlockProps(null, "TourDatesBlock")).toBeUndefined();
  });

  it("trims root props and ignores empty ones", () => {
    expect(rootProp(data, "title")).toBe("Tour");
    expect(rootProp(data, "description")).toBeUndefined();
  });
});
