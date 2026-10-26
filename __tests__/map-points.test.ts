import { describe, expect, it } from "vitest";

import { mapPoints, normalizeShows, shows } from "../lib/site/tour";

const row = { date: "2027-03-12", city: "Sample City, CA", venue: "Example Hall", address: "1 Main St", lat: 36.7783, lon: -119.4179 };

describe("mapPoints", () => {
  it("makes a pin from a show: venue as the label, address and city as the detail", () => {
    const [pin] = mapPoints(normalizeShows([{ ...row, id: "sample-city-2027-03-12" }]));
    expect(pin).toEqual({ id: "sample-city-2027-03-12", label: "Example Hall", detail: "1 Main St, Sample City, CA", lat: 36.7783, lon: -119.4179 });
  });

  it("falls back to the city when there is no address", () => {
    const [pin] = mapPoints(normalizeShows([{ ...row, address: "" }]));
    expect(pin.detail).toBe("Sample City, CA");
  });

  it("links to the ticket page only when asked to", () => {
    const list = normalizeShows([{ ...row, id: "sample-city-2027-03-12" }]);
    expect(mapPoints(list)[0]).not.toHaveProperty("href");
    expect(mapPoints(list, true)[0].href).toBe("/tickets/sample-city-2027-03-12");
  });

  it("leaves out a show with no coordinates", () => {
    const list = normalizeShows([{ ...row, lat: undefined, lon: undefined }, { ...row, date: "2027-03-13", city: "Sample Town, OR" }]);
    expect(mapPoints(list).map((p) => p.id)).toEqual([list[1].id]);
  });

  it("covers every show in the repo copy", () => {
    expect(mapPoints(shows)).toHaveLength(shows.length);
  });
});
