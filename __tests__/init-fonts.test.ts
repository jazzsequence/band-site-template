import { describe, expect, it } from "vitest";

import { describeFont, FontLookupError, lookupFont, roleWarnings, slugify, type FetchJson } from "../lib/init/fonts";

// Responses shaped like api.fontsource.org's, trimmed to what the lookup reads.
const RECORDS: Record<string, unknown> = {
  "playfair-display": { id: "playfair-display", family: "Playfair Display", subsets: ["cyrillic", "latin", "latin-ext"], weights: [400, 500, 600, 700, 800, 900], variable: true, category: "serif", license: "OFL-1.1", npmVersion: "5.3.0" },
  "bebas-neue": { id: "bebas-neue", family: "Bebas Neue", subsets: ["latin", "latin-ext"], weights: [400], variable: false, category: "sans-serif", license: "OFL-1.1", npmVersion: "5.3.0" },
  // Variable, but along width only: no weight axis, so it ships as static files.
  "width-only": { id: "width-only", family: "Width Only", subsets: ["latin"], weights: [400, 700], variable: true, category: "sans-serif", license: "OFL-1.1", npmVersion: "5.1.2" },
  "noto-sans-jp": { id: "noto-sans-jp", family: "Noto Sans JP", subsets: ["japanese"], weights: [400], variable: false, category: "sans-serif", license: "OFL-1.1", npmVersion: "5.3.0" },
  "material-icons": { id: "material-icons", family: "Material Icons", subsets: ["latin"], weights: [400], variable: false, category: "icons", license: "Apache-2.0", npmVersion: "5.3.0" },
  "mislabelled": { id: "something-else", family: "Mislabelled", subsets: ["latin"], weights: [400], variable: false, category: "serif", npmVersion: "5.3.0" },
};
const AXES: Record<string, unknown> = {
  "playfair-display": { family: "Playfair Display", axes: { ital: { min: "0", max: "1" }, wght: { min: "400", max: "900" } } },
  "width-only": { family: "Width Only", axes: { wdth: { min: "75", max: "125" } } },
};

const calls: string[] = [];
const get: FetchJson = async (url) => {
  calls.push(url);
  const [, kind, id] = url.match(/\/v1\/(fonts|variable)\/(.+)$/) ?? [];
  const table = kind === "fonts" ? RECORDS : AXES;
  return id in table ? { status: 200, json: table[id] } : { status: 404, json: { error: "not found" } };
};

describe("slugify", () => {
  it("turns a family name into a Fontsource id", () => {
    expect(slugify("Playfair Display")).toBe("playfair-display");
    expect(slugify("  M PLUS 1p ")).toBe("m-plus-1p");
    expect(slugify("bebas-neue")).toBe("bebas-neue");
    expect(slugify("../etc/passwd")).toBe("etc-passwd");
  });
});

describe("lookupFont", () => {
  it("returns the facts the config records, with the version to install", async () => {
    const info = await lookupFont("Playfair Display", get);
    expect(info.face).toEqual({ id: "playfair-display", family: "Playfair Display", category: "serif", variable: true, weights: [400, 500, 600, 700, 800, 900] });
    expect(info.version).toBe("5.3.0");
    expect(info.license).toBe("OFL-1.1");
    expect(info.specimen).toBe("https://fontsource.org/fonts/playfair-display");
  });

  it("only asks for the axes of a family that says it is variable", async () => {
    calls.length = 0;
    expect((await lookupFont("bebas-neue", get)).face.variable).toBe(false);
    expect(calls).toEqual(["https://api.fontsource.org/v1/fonts/bebas-neue"]);
  });

  it("treats a variable family with no weight axis as static", async () => {
    expect((await lookupFont("width-only", get)).face).toMatchObject({ variable: false, weights: [400, 700] });
  });

  it("says a missing font is a custom font, and what to do about it", async () => {
    const e = await lookupFont("Acme Grotesk", get).catch((x) => x);
    expect(e).toBeInstanceOf(FontLookupError);
    expect(e.message).toContain('no font "acme-grotesk"');
    expect(e.message).toContain("design PR after setup");
  });

  it("refuses a font with no Latin set, a non-text category, and a record for a different id", async () => {
    await expect(lookupFont("noto-sans-jp", get)).rejects.toThrow(/no Latin letters/);
    await expect(lookupFont("material-icons", get)).rejects.toThrow(/not a text face/);
    await expect(lookupFont("mislabelled", get)).rejects.toThrow(/no usable id/);
  });

  it("does not send a request for something that is not a font name", async () => {
    calls.length = 0;
    await expect(lookupFont("???", get)).rejects.toThrow(/not a font name/);
    await expect(lookupFont("a".repeat(80), get)).rejects.toThrow(/not a font name/);
    expect(calls).toEqual([]);
  });

  it("reports a failing lookup instead of guessing", async () => {
    await expect(lookupFont("bebas-neue", async () => ({ status: 503, json: null }))).rejects.toThrow(/failed \(HTTP 503\)/);
    const flaky: FetchJson = async (url) => (url.includes("/variable/") ? { status: 500, json: null } : { status: 200, json: RECORDS["playfair-display"] });
    await expect(lookupFont("playfair-display", flaky)).rejects.toThrow(/axes for "playfair-display" failed \(HTTP 500\)/);
  });
});

describe("roleWarnings", () => {
  const face = (over: Partial<Parameters<typeof roleWarnings>[0]>) => ({ id: "x", family: "X", category: "sans-serif" as const, variable: false, weights: [400, 700], ...over });

  it("says nothing about an ordinary choice", () => {
    expect(roleWarnings(face({}), "body")).toEqual([]);
    expect(roleWarnings(face({ weights: [400, 700, 800] }), "display")).toEqual([]);
    expect(roleWarnings(face({ variable: true, weights: [400] }), "display")).toEqual([]);
  });

  it("warns about a display or handwriting face for body copy, and capitals in a handwriting wordmark", () => {
    expect(roleWarnings(face({ category: "handwriting" }), "body")[0]).toContain("hard to read at paragraph length");
    expect(roleWarnings(face({ category: "display" }), "body")[0]).toContain("hard to read at paragraph length");
    expect(roleWarnings(face({ category: "handwriting" }), "wordmark")[0]).toContain("leave uppercase off");
  });

  it("warns when a static face has no weight as heavy as the headings, or no bold for body text", () => {
    expect(roleWarnings(face({ weights: [400] }), "display")[0]).toContain("tops out at 400");
    expect(roleWarnings(face({ weights: [300, 400] }), "body")[0]).toContain("faked bold");
  });
});

describe("describeFont", () => {
  it("says how a face ships, where to see it, and the notes for its role", async () => {
    const bebas = describeFont(await lookupFont("bebas-neue", get), "display");
    expect(bebas).toContain("Bebas Neue (sans-serif), OFL-1.1");
    expect(bebas).toContain("static files at 400 (of 400)");
    expect(bebas).toContain("see it: https://fontsource.org/fonts/bebas-neue");
    expect(bebas).toContain("note: Bebas Neue tops out at 400");
    expect(describeFont(await lookupFont("playfair-display", get))).toContain("one variable file covering every weight");
  });
});
