import { describe, expect, it } from "vitest";

import { findBlockProps, rootProp } from "../lib/site/p1-content";
import { normalizeShows, showId } from "../lib/site/tour";

describe("showId", () => {
  it("keeps an explicit id so existing ticket links survive edits", () => {
    expect(showId({ id: "sf-1997-10-07", city: "San Francisco, CA", date: "1997-10-07" })).toBe("sf-1997-10-07");
  });
  it("derives a stable id for new dates", () => {
    expect(showId({ city: "Salt Lake City, UT", date: "1997-11-06" })).toBe("salt-lake-city-1997-11-06");
  });
});

describe("normalizeShows (untrusted editor input)", () => {
  const good = { date: "1997-10-18", city: "Oakland, CA", venue: "Paramount Theatre", doors: "7:00 PM", price: 28.5, status: "on-sale", lat: 37.8, lon: -122.27 };

  it("sorts by date and fills ids", () => {
    const rows = normalizeShows([{ ...good, date: "1997-10-18" }, { ...good, date: "1997-10-07", city: "San Francisco, CA", venue: "Roderick's Chamber" }]);
    expect(rows.map((r) => r.date)).toEqual(["1997-10-07", "1997-10-18"]);
    expect(rows[0].id).toBe("san-francisco-1997-10-07");
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
