/**
 * Looks a font up in Fontsource, the catalogue /init-band picks typefaces from, and returns what band.config.json records
 * about it (lib/theme/fonts.ts). The registry is the single source of those facts: the answers carry a name, never the
 * facts, so a hand-typed weight list cannot disagree with the package that gets installed.
 */
import { FAMILY_PATTERN, FONT_CATEGORIES, ID_PATTERN, pickWeights, WANTED_WEIGHTS, type FontCategory, type FontFace, type FontRole } from "../theme/fonts";

export const FONTSOURCE_API = "https://api.fontsource.org/v1";

export type FontInfo = {
  face: FontFace;
  /** The version of the Fontsource packages to install (`^version` in package.json). */
  version: string;
  license: string;
  /** Where the person can see the font before choosing it. */
  specimen: string;
};

export class FontLookupError extends Error {}

/** How a lookup talks to the network, injectable so tests never do. */
export type FetchJson = (url: string) => Promise<{ status: number; json: unknown }>;

export const fetchJson: FetchJson = async (url) => {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    throw new FontLookupError(`Could not reach Fontsource (${e instanceof Error ? e.message : e}). Check the connection and try again.`);
  }
  return { status: res.status, json: await res.json().catch(() => null) };
};

/** "Playfair Display" -> "playfair-display": Fontsource ids are the family name, lowercased and hyphenated. */
export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export async function lookupFont(nameOrId: string, get: FetchJson = fetchJson): Promise<FontInfo> {
  const id = slugify(nameOrId);
  if (!ID_PATTERN.test(id) || id.length > 64) throw new FontLookupError(`"${nameOrId}" is not a font name.`);

  const res = await get(`${FONTSOURCE_API}/fonts/${id}`);
  if (res.status === 404) {
    throw new FontLookupError(
      `Fontsource has no font "${id}", so it cannot be self-hosted from there. If the name is right it is a custom font: pick the nearest Fontsource face as a stand-in now, and add the real one in a design PR after setup.`,
    );
  }
  if (res.status !== 200 || !isObject(res.json)) throw new FontLookupError(`Fontsource lookup for "${id}" failed (HTTP ${res.status}).`);
  const info = res.json;

  const bad = (what: string) => new FontLookupError(`Fontsource's record for "${id}" has no usable ${what}.`);
  if (info.id !== id) throw bad("id");
  if (typeof info.family !== "string" || !FAMILY_PATTERN.test(info.family)) throw bad("family name");
  if (!(FONT_CATEGORIES as readonly unknown[]).includes(info.category)) {
    throw new FontLookupError(`"${info.family}" is not a text face (Fontsource lists it as ${String(info.category)}); this design system sets text only.`);
  }
  if (!Array.isArray(info.weights) || !info.weights.length || info.weights.some((w) => !Number.isInteger(w))) throw bad("weights");
  if (typeof info.npmVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(info.npmVersion)) throw bad("package version");
  if (!Array.isArray(info.subsets) || !info.subsets.includes("latin")) {
    throw new FontLookupError(`"${info.family}" has no Latin letters, and this site is set in English; pick a face with a Latin set.`);
  }

  // A variable family only helps when its axes include weight (some vary only in width or optical size).
  let variable = false;
  if (info.variable === true) {
    const axes = await get(`${FONTSOURCE_API}/variable/${id}`);
    if (axes.status !== 200 && axes.status !== 404) throw new FontLookupError(`Fontsource lookup of the axes for "${id}" failed (HTTP ${axes.status}).`);
    variable = axes.status === 200 && isObject(axes.json) && isObject(axes.json.axes) && "wght" in axes.json.axes;
  }

  return {
    face: { id, family: info.family, category: info.category as FontCategory, variable, weights: [...new Set(info.weights as number[])].sort((a, b) => a - b) },
    version: info.npmVersion,
    license: typeof info.license === "string" ? info.license : "unknown",
    specimen: `https://fontsource.org/fonts/${id}`,
  };
}

/** Things worth telling the person about a face for the role they chose it for. Taste, not rules: none of them blocks. */
export function roleWarnings(face: FontFace, role: FontRole): string[] {
  const out: string[] = [];
  if (role === "body" && (face.category === "display" || face.category === "handwriting")) {
    out.push(`${face.family} is a ${face.category} face, which is hard to read at paragraph length; a plain sans-serif or serif is usually better for body copy.`);
  }
  if (role === "wordmark" && face.category === "handwriting") out.push(`${face.family} is a handwriting face: capitals usually read badly in one, so leave uppercase off.`);
  if (!face.variable) {
    const picked = pickWeights(face.weights, WANTED_WEIGHTS[role]);
    const wanted = WANTED_WEIGHTS[role];
    if ((role === "display" || role === "wordmark") && Math.max(...picked) < Math.max(...wanted) - 100) {
      out.push(`${face.family} tops out at ${Math.max(...picked)}, lighter than the extra-bold headings are set in; they will use that weight as designed, not a faked bold.`);
    }
    if (role === "body" && Math.max(...picked) < 600) out.push(`${face.family} has no bold, so <strong> text will be a faked bold.`);
  }
  return out;
}

/** What /init-band shows the person: the face, how it ships, its licence, where to see it, and any warnings for its role. */
export function describeFont(info: FontInfo, role?: FontRole): string {
  const { face } = info;
  const ships = face.variable
    ? "one variable file covering every weight"
    : `static files at ${pickWeights(face.weights, WANTED_WEIGHTS[role ?? "display"]).join(", ")} (of ${face.weights.join(", ")})`;
  const lines = [`${face.family} (${face.category}), ${info.license}`, `  ships as ${ships}`, `  see it: ${info.specimen}`];
  for (const w of role ? roleWarnings(face, role) : []) lines.push(`  note: ${w}`);
  return lines.join("\n");
}
