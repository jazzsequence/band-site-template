/**
 * Options for the social card that scripts/make-brand-assets.mjs draws: an optional hero photo behind the band name, and where in
 * the photo to keep when it is cropped to the card's shape.
 *
 * Dependency-free and erasable-syntax-only (no enums, no parameter properties): the script imports this file directly through
 * Node's type stripping, as it does lib/theme/fonts.ts.
 */
export type CardOptions = {
  /** Path of the hero photo. Absent: the card is the name on the surface gradient. */
  hero?: string;
  /** The point of the photo to keep in frame, as percentages from the top left (50, 50 is the centre). */
  focus: { x: number; y: number };
};

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** The image type for a hero file, by extension; undefined when the card cannot use it. */
export function heroMime(file: string): string | undefined {
  return MIME[file.slice(file.lastIndexOf(".") + 1).toLowerCase()];
}

const USAGE = "usage: node scripts/make-brand-assets.mjs [--hero <image>] [--focus <x%>,<y%>]";

export function parseCardArgs(argv: string[]): CardOptions {
  const options: CardOptions = { focus: { x: 50, y: 50 } };
  let sawFocus = false;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag !== "--hero" && flag !== "--focus") throw new Error(`Unknown argument "${flag}". ${USAGE}`);
    const value = argv[++i];
    if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a value. ${USAGE}`);
    if (flag === "--hero") {
      if (!heroMime(value)) throw new Error(`--hero ${value}: the card can use a ${Object.keys(MIME).join(", ")} image.`);
      options.hero = value;
    } else {
      const [x, y, ...rest] = value.split(",").map((n) => (n.trim() === "" ? NaN : Number(n)));
      if (rest.length || ![x, y].every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) throw new Error(`--focus ${value}: give two percentages from 0 to 100, like 50,30.`);
      options.focus = { x, y };
      sawFocus = true;
    }
  }
  if (sawFocus && !options.hero) throw new Error("--focus only means something with --hero.");
  return options;
}
