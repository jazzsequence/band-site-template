import { readFileSync } from "node:fs";

// Read as files: Playwright's ESM loader rejects a bare JSON import, so specs cannot import lib/band/config.
const config = JSON.parse(readFileSync("band.config.json", "utf8")) as {
  band: { name: string };
  features: Record<"tour" | "merch" | "lyrics" | "map" | "press", boolean>;
};

export const band = config.band;
export const features = config.features;

/** The items, but only when that section is switched on in band.config.json: lets a spec list every route and still pass for a band that has turned some off. */
export const when = <T>(feature: keyof typeof features, ...items: T[]): T[] => (features[feature] ? items : []);

/** A colour token as the site renders it (after the contrast gate), read from the generated theme. */
export function token(name: string): string {
  const hex = readFileSync("design-system/theme.generated.css", "utf8").match(new RegExp(`--color-${name}: (#[0-9a-f]{6});`))?.[1];
  if (!hex) throw new Error(`--color-${name} not found in design-system/theme.generated.css; run pnpm theme`);
  return hex;
}
