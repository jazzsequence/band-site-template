import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TourMap } from "../design-system/components/TourMap";

const points = [
  { id: "a", label: "Paramount Theatre", detail: "2025 Broadway, Oakland, CA", lat: 37.8099, lon: -122.2687 },
  { id: "b", label: "Club DV8", detail: "115 S West Temple, Salt Lake City, UT", lat: 40.7668, lon: -111.8938 },
];

describe("TourMap before the visitor asks for the map", () => {
  const html = renderToStaticMarkup(<TourMap points={points} label="All tour dates" />);

  it("lists every place and its address as text, with no link out to OpenStreetMap", () => {
    for (const p of points) {
      expect(html).toContain(p.label);
      expect(html).toContain(p.detail);
    }
    expect(html).not.toContain("openstreetmap.org");
  });

  it("offers the map by button and says what loading it does", () => {
    expect(html).toContain("Show map");
    expect(html).toContain("OpenStreetMap, which will see your IP address");
  });

  it("requests no tiles and renders no map until asked", () => {
    expect(html).not.toContain("tile.openstreetmap.org");
    expect(html).not.toContain("Map: All tour dates");
  });
});
