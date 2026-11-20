import { describe, expect, it } from "vitest";

import { heroMime, parseCardArgs } from "../lib/theme/og-card";

describe("parseCardArgs", () => {
  it("is the plain card with no arguments, and the photo's centre when only a hero is given", () => {
    expect(parseCardArgs([])).toEqual({ focus: { x: 50, y: 50 } });
    expect(parseCardArgs(["--hero", "public/images/hero.jpg"])).toEqual({ hero: "public/images/hero.jpg", focus: { x: 50, y: 50 } });
  });

  it("reads a focal point in either order of the flags", () => {
    expect(parseCardArgs(["--hero", "a.png", "--focus", "30,20"])).toEqual({ hero: "a.png", focus: { x: 30, y: 20 } });
    expect(parseCardArgs(["--focus", "0, 100", "--hero", "a.webp"]).focus).toEqual({ x: 0, y: 100 });
  });

  it("says what is wrong instead of drawing a card from a bad argument", () => {
    expect(() => parseCardArgs(["--heroo", "a.jpg"])).toThrow(/Unknown argument "--heroo"/);
    expect(() => parseCardArgs(["--hero"])).toThrow(/--hero needs a value/);
    expect(() => parseCardArgs(["--hero", "--focus", "1,1"])).toThrow(/--hero needs a value/);
    expect(() => parseCardArgs(["--hero", "clip.mp4"])).toThrow(/png, jpg, jpeg, webp/);
    for (const bad of ["50", "50,", ",50", "a,b", "50,101", "-1,5", "1,2,3"]) {
      expect(() => parseCardArgs(["--hero", "a.jpg", "--focus", bad]), bad).toThrow(/two percentages from 0 to 100/);
    }
    expect(() => parseCardArgs(["--focus", "50,50"])).toThrow(/only means something with --hero/);
  });
});

describe("heroMime", () => {
  it("knows the image types a card can use, whatever the case of the extension", () => {
    expect(heroMime("a/b.JPG")).toBe("image/jpeg");
    expect(heroMime("a.jpeg")).toBe("image/jpeg");
    expect(heroMime("a.png")).toBe("image/png");
    expect(heroMime("a.webp")).toBe("image/webp");
    expect(heroMime("a.svg")).toBeUndefined();
    expect(heroMime("noextension")).toBeUndefined();
  });
});
