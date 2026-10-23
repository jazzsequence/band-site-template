import { describe, expect, it } from "vitest";

import { mapPoints, normalizeShows, shows } from "../lib/site/tour";

const row = { date: "1997-10-07", city: "San Francisco, CA", venue: "Roderick's Chamber", address: "715 Harrison St", lat: 37.7821, lon: -122.3976 };

describe("mapPoints", () => {
  it("makes a pin from a show: venue as the label, address and city as the detail", () => {
    const [pin] = mapPoints(normalizeShows([{ ...row, id: "sf-1997-10-07" }]));
    expect(pin).toEqual({ id: "sf-1997-10-07", label: "Roderick's Chamber", detail: "715 Harrison St, San Francisco, CA", lat: 37.7821, lon: -122.3976 });
  });

  it("falls back to the city when there is no address", () => {
    const [pin] = mapPoints(normalizeShows([{ ...row, address: "" }]));
    expect(pin.detail).toBe("San Francisco, CA");
  });

  it("links to the ticket page only when asked to", () => {
    const list = normalizeShows([{ ...row, id: "sf-1997-10-07" }]);
    expect(mapPoints(list)[0]).not.toHaveProperty("href");
    expect(mapPoints(list, true)[0].href).toBe("/tickets/sf-1997-10-07");
  });

  it("leaves out a show with no coordinates", () => {
    const list = normalizeShows([{ ...row, lat: undefined, lon: undefined }, { ...row, date: "1997-10-08", city: "Oakland, CA" }]);
    expect(mapPoints(list).map((p) => p.id)).toEqual([list[1].id]);
  });

  it("covers every show in the repo copy", () => {
    expect(mapPoints(shows)).toHaveLength(shows.length);
  });
});
