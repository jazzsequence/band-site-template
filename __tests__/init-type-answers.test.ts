import { describe, expect, it } from "vitest";

import { AnswersError } from "../lib/init/answers";
import { FontLookupError, slugify, type FontInfo } from "../lib/init/fonts";
import { resolveTypeAnswers } from "../lib/init/type-answers";
import { DEFAULT_TYPOGRAPHY, type FontFace } from "../lib/theme/fonts";
import { FULL_TYPOGRAPHY } from "./fixtures/typography";

// The faces the wordmark and kicker fixtures carry also have an uppercase flag or not; the catalogue holds the facts only.
const plain = ({ id, family, category, variable, weights }: FontFace): FontFace => ({ id, family, category, variable, weights });
const CATALOGUE: FontFace[] = [
  { id: "playfair-display", family: "Playfair Display", category: "serif", variable: true, weights: [400, 500, 600, 700, 800, 900] },
  { id: "bebas-neue", family: "Bebas Neue", category: "sans-serif", variable: false, weights: [400] },
  plain(FULL_TYPOGRAPHY.wordmark!),
  plain(FULL_TYPOGRAPHY.kicker!),
];

const calls: string[] = [];
const lookup = async (name: string): Promise<FontInfo> => {
  calls.push(name);
  const face = CATALOGUE.find((f) => f.id === slugify(name));
  if (!face) throw new FontLookupError(`Fontsource has no font "${slugify(name)}".`);
  return { face, version: "5.3.0", license: "OFL-1.1", specimen: `https://fontsource.org/fonts/${face.id}` };
};
const resolve = (raw: unknown, current = DEFAULT_TYPOGRAPHY, installed = () => true) => resolveTypeAnswers(raw, current, installed, lookup);
const problems = async (raw: unknown, current = DEFAULT_TYPOGRAPHY) => {
  const e = await resolve(raw, current).catch((x) => x);
  expect(e).toBeInstanceOf(AnswersError);
  return (e as AnswersError).problems.join("\n");
};

describe("resolveTypeAnswers", () => {
  it("keeps what the repo has, without a lookup, when no type is answered or a role is left out", async () => {
    calls.length = 0;
    expect(await resolve(undefined)).toEqual({ typography: DEFAULT_TYPOGRAPHY, versions: {} });
    expect(await resolve({})).toEqual({ typography: DEFAULT_TYPOGRAPHY, versions: {} });
    expect(await resolve({ wordmark: undefined })).toEqual({ typography: DEFAULT_TYPOGRAPHY, versions: {} });
    expect(calls).toEqual([]);
  });

  it("looks up each name and records the version to install, by id", async () => {
    const { typography, versions } = await resolve({
      display: "Playfair Display",
      wordmark: { font: "Unbounded", uppercase: true },
      kicker: "unifrakturcook",
    });
    expect(typography.display).toMatchObject({ id: "playfair-display", variable: true });
    expect(typography.body).toEqual(DEFAULT_TYPOGRAPHY.body);
    expect(typography.wordmark).toMatchObject({ id: "unbounded", uppercase: true });
    expect(typography.kicker).toMatchObject({ id: "unifrakturcook" });
    expect(versions).toEqual({ "playfair-display": "5.3.0", unbounded: "5.3.0", unifrakturcook: "5.3.0" });
  });

  it("does not look a face up again when it is unchanged and its package is installed, and does when it is not", async () => {
    calls.length = 0;
    const same = await resolve({ display: "Encode Sans Expanded", body: "space-grotesk" });
    expect(same).toEqual({ typography: DEFAULT_TYPOGRAPHY, versions: {} });
    expect(calls).toEqual([]);
    await resolve({ display: "Encode Sans Expanded" }, DEFAULT_TYPOGRAPHY, () => false).catch(() => undefined);
    expect(calls).toEqual(["Encode Sans Expanded"]);
  });

  it("switches the wordmark and kicker off with null, and changes only uppercase for an unchanged wordmark face", async () => {
    const off = await resolve({ wordmark: null, kicker: null }, FULL_TYPOGRAPHY);
    expect(off.typography).toMatchObject({ wordmark: null, kicker: null });
    calls.length = 0;
    const lower = await resolve({ wordmark: { font: "Unbounded", uppercase: false } }, FULL_TYPOGRAPHY);
    expect(lower.typography.wordmark).toMatchObject({ id: "unbounded", uppercase: false });
    expect(calls).toEqual([]);
  });

  it("names every problem at once, by the role it was answered under", async () => {
    const out = await problems({
      display: "Acme Grotesk",
      body: 7,
      wordmark: { font: "Unbounded", uppercase: "yes" },
      kicker: "",
      footer: "Inter",
    });
    expect(out).toContain('type.display: Fontsource has no font "acme-grotesk"');
    expect(out).toContain("type.body must be a font name");
    expect(out).toContain("type.wordmark.uppercase must be true or false");
    expect(out).toContain("type.kicker must be a font name");
    expect(out).toContain("type.footer is not a known type role");
  });

  it("rejects an object-less wordmark and a null display or body, and says what replaced the old switches", async () => {
    expect(await problems({ wordmark: "Unbounded" })).toContain("type.wordmark must be null or { font, uppercase }");
    expect(await problems({ display: null, body: null })).toContain("type.display cannot be null: headings need a face");
    expect(await problems({ wordmarkFace: true, accentFace: false })).toContain("type.wordmarkFace was replaced by type.wordmark");
    expect(await problems({ accentFace: true })).toContain("type.accentFace was replaced by type.kicker");
    expect(await problems("Inter")).toBe("type must be an object");
  });
});
