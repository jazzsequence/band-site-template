import { FontLookupError, slugify, type FontInfo } from "../../lib/init/fonts";
import { DEFAULT_TYPOGRAPHY, type FontFace, type Typography } from "../../lib/theme/fonts";

/** Every optional role set: a wordmark face in capitals and a kicker face, so tests cover the paths the defaults skip. */
export const FULL_TYPOGRAPHY: Typography = {
  ...DEFAULT_TYPOGRAPHY,
  wordmark: { id: "unbounded", family: "Unbounded", category: "sans-serif", variable: true, weights: [200, 300, 400, 500, 600, 700, 800, 900], uppercase: true },
  kicker: { id: "unifrakturcook", family: "UnifrakturCook", category: "display", variable: false, weights: [700] },
};

/** The same choices as the person answers them: a font name per role. */
export const FULL_TYPE_ANSWER = { wordmark: { font: "Unbounded", uppercase: true }, kicker: "UnifrakturCook" };

// The facts a lookup returns, without the wordmark's uppercase flag.
const plain = ({ id, family, category, variable, weights }: FontFace): FontFace => ({ id, family, category, variable, weights });
export const CATALOGUE: FontFace[] = [
  plain(DEFAULT_TYPOGRAPHY.display),
  plain(DEFAULT_TYPOGRAPHY.body),
  { id: "playfair-display", family: "Playfair Display", category: "serif", variable: true, weights: [400, 500, 600, 700, 800, 900] },
  { id: "bebas-neue", family: "Bebas Neue", category: "sans-serif", variable: false, weights: [400] },
  plain(FULL_TYPOGRAPHY.wordmark!),
  plain(FULL_TYPOGRAPHY.kicker!),
];

/** A stand-in for Fontsource over CATALOGUE that records every name it is asked for. */
export function makeLookup() {
  const calls: string[] = [];
  const lookup = async (name: string): Promise<FontInfo> => {
    calls.push(name);
    const face = CATALOGUE.find((f) => f.id === slugify(name));
    if (!face) throw new FontLookupError(`Fontsource has no font "${slugify(name)}".`);
    return { face, version: "5.3.0", license: "OFL-1.1", specimen: `https://fontsource.org/fonts/${face.id}` };
  };
  return { lookup, calls };
}
