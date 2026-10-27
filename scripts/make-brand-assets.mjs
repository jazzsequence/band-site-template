/**
 * Regenerates icons and the social card in the band's own type.
 *
 *   node scripts/make-brand-assets.mjs [--hero <image>] [--focus <x%>,<y%>]
 *
 * With --hero the card is that photo, cropped to the card's shape, with the name set over a darkening of the surface colour at the foot
 * of it; --focus (default 50,50) is the point of the photo to keep in frame when the crop cuts it, as percentages from the top left.
 * Use the same photo as the home page's hero (public/images/...). Without --hero the card is the name on the surface gradient. The photo
 * is the band's own, so nothing here checks it: look at public/og-default.jpg before committing it.
 *
 * app/   icon.png, icon.svg, apple-icon.png, favicon.ico   (Next file conventions)
 * public/icons/   icon-192.png, icon-512.png, icon-maskable-512.png   (referenced by app/manifest.ts)
 * public/og-default.jpg   1200x630 social card (JPEG: with a photo behind the name a PNG is megabytes, and link previews fetch it)
 *
 * The mark is the band name's first letter on the site's darkest surface with an accent bar, and the card is the name on a surface
 * gradient. Both are set the way the site sets the name: in the wordmark face (capitals if typography.wordmark.uppercase) or, with no
 * wordmark face, in the display face as typed. The face's static Fontsource files are used even when the site ships the variable one, so
 * `pnpm install` must have run (fontFileProblems in lib/init/font-packages.ts checks the same files). Name and colours come from
 * band.config.json and the generated theme (run `pnpm theme` first if you changed the palette), so a re-themed band gets matching assets.
 *
 * Every icon is rendered from one outlined glyph path, so the PNGs, the maskable icon and the SVG favicon agree whatever the face's
 * metrics are and none of them depends on a font being installed where they are shown.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { chromium } from "@playwright/test";
import opentype from "opentype.js";

import { assetFace, assetWeight, readTypography } from "../lib/theme/fonts.ts";
import { heroMime, parseCardArgs } from "../lib/theme/og-card.ts";

const require = createRequire(import.meta.url);

const card = parseCardArgs(process.argv.slice(2));
const heroUrl = card.hero
  ? (() => {
      try {
        return `data:${heroMime(card.hero)};base64,${readFileSync(card.hero).toString("base64")}`;
      } catch (e) {
        throw new Error(`Could not read the hero image ${card.hero}: ${e.message}`);
      }
    })()
  : null;

const { band, typography: rawTypography } = JSON.parse(readFileSync("band.config.json", "utf8"));
const problems = [];
const typography = readTypography(rawTypography, problems);
if (problems.length) throw new Error(`band.config.json typography is not valid:\n- ${problems.join("\n- ")}`);
const face = assetFace(typography);
const weight = assetWeight(typography);

const fontFile = (ext) => {
  const dir = path.dirname(require.resolve(`@fontsource/${face.id}/package.json`));
  const file = path.join(dir, "files", `${face.id}-latin-${weight}-normal.${ext}`);
  try {
    return readFileSync(file);
  } catch {
    throw new Error(`${file} is missing: run pnpm install (the icons and social card are drawn from @fontsource/${face.id}, weight ${weight})`);
  }
};

const theme = readFileSync("design-system/theme.generated.css", "utf8");
const token = (name) => theme.match(new RegExp(`--color-${name}: (#[0-9a-f]{6});`))?.[1] ?? (() => { throw new Error(`--color-${name} not found in theme.generated.css; run pnpm theme`); })();
const INK = token("void");
const SURFACE = token("surface");
const RAISED = token("raised");
const METAL_HI = token("metal-hi");
const ACCENT = token("accent");
const NAME = band.name;
const INITIAL = [...NAME][0].toUpperCase();
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// The site's wordmark is tighter than its headings; the assets follow whichever the name is set in.
const TRACKING = typography.wordmark ? "-0.05em" : "-0.04em";

// opentype.js reads WOFF but not WOFF2, so the glyph outline comes from the WOFF file and the card's text from the WOFF2.
const outline = (() => {
  const raw = fontFile("woff");
  return opentype.parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
})();

// The initial as a path in a 512 box: centred horizontally and sitting slightly above centre, to leave room for the bar.
function glyphPath(scale) {
  const glyph = outline.getPath(INITIAL, 0, 0, 512 * scale);
  const box = glyph.getBoundingBox();
  const dx = (512 - (box.x2 - box.x1)) / 2 - box.x1 - 512 * 0.01;
  const dy = (512 - (box.y2 - box.y1)) / 2 - box.y1 - 512 * 0.06;
  glyph.commands.forEach((c) => {
    for (const k of ["x", "x1", "x2"]) if (k in c) c[k] += dx;
    for (const k of ["y", "y1", "y2"]) if (k in c) c[k] += dy;
  });
  return glyph.toPathData(2);
}

const iconSvg = ({ round, scale, size }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"${size ? ` width="${size}" height="${size}"` : ""}><title>${esc(NAME)}</title>` +
  `<clipPath id="r"><rect width="512" height="512" rx="${round ? 102 : 0}"/></clipPath>` +
  `<g clip-path="url(#r)"><rect width="512" height="512" fill="${INK}"/>` +
  `<path d="${glyphPath(scale)}" fill="${METAL_HI}"/>` +
  `<rect y="445" width="512" height="67" fill="${ACCENT}"/></g></svg>`;

const fontFace = `@font-face { font-family: U; src: url(data:font/woff2;base64,${fontFile("woff2").toString("base64")}); font-weight: ${weight}; }`;
const cardHtml = (titleSize) => `<!doctype html><meta charset="utf-8"><style>
  ${fontFace}
  html, body { margin: 0; }
  .card { width: 1200px; height: 630px; position: relative; overflow: hidden; background: linear-gradient(135deg, ${INK} 0%, ${SURFACE} 45%, ${RAISED} 100%); }
${heroUrl ? `  .card .photo { position: absolute; inset: 0; background: url(${heroUrl}) ${card.focus.x}% ${card.focus.y}% / cover no-repeat; }
  /* Enough of the surface colour under the name that it reads on any photo, fading out before the face of a portrait. */
  .card .scrim { position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in srgb, ${INK} 92%, transparent) 0%, color-mix(in srgb, ${INK} 75%, transparent) 28%, transparent 62%); }
` : ""}  .card h1 { position: absolute; left: 72px; right: 72px; bottom: 64px; margin: 0; font: ${weight} ${titleSize}px/1 U; letter-spacing: ${TRACKING}; ${face.uppercase ? "text-transform: uppercase; " : ""}color: ${METAL_HI}; }
  .card .bar { position: absolute; left: 72px; bottom: 40px; width: 150px; height: 8px; background: ${ACCENT}; }
</style><div class="card">${heroUrl ? '<div class="photo"></div><div class="scrim"></div>' : ""}<h1>${esc(NAME)}</h1><div class="bar"></div></div>`;

const browser = await chromium.launch();
const open = async (html, w, h) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html);
  await page.evaluate((spec) => document.fonts.load(spec), `${weight} 64px U`);
  await page.evaluate(() => document.fonts.ready);
  return page;
};
const shoot = async (html, w, h, selector, options = { omitBackground: true, type: "png" }) => {
  const page = await open(html, w, h);
  const buf = await page.locator(selector).screenshot(options);
  await page.close();
  return buf;
};
// Rounded icons carry an alpha channel, which Next requires for the PNGs inside favicon.ico.
const icon = (size, opts = { round: true, scale: 0.64 }) =>
  shoot(`<!doctype html><meta charset="utf-8"><style>html, body { margin: 0; background: transparent; } svg { display: block; }</style>${iconSvg({ ...opts, size })}`, size, size, "svg");

// The card's title is as large as fits on one line (at most 168px); a name too long even at 56px wraps upward from its baseline.
const measure = await open(cardHtml(100).replace("<h1>", '<h1 style="white-space: nowrap; right: auto;">'), 1200, 630);
const width = await measure.locator("h1").evaluate((el) => el.getBoundingClientRect().width);
await measure.close();
const TITLE_SIZE = Math.max(56, Math.min(168, Math.floor((1056 / width) * 100)));

mkdirSync("public/icons", { recursive: true });
writeFileSync("app/icon.png", await icon(512));
writeFileSync("app/apple-icon.png", await icon(180, { round: false, scale: 0.64 }));
writeFileSync("public/icons/icon-192.png", await icon(192));
writeFileSync("public/icons/icon-512.png", await icon(512));
// Maskable: full bleed, with the mark inside the central 80% safe zone.
writeFileSync("public/icons/icon-maskable-512.png", await icon(512, { round: false, scale: 0.5 }));
writeFileSync("public/og-default.jpg", await shoot(cardHtml(TITLE_SIZE), 1200, 630, ".card", { type: "jpeg", quality: 90 }));
writeFileSync("app/icon.svg", `${iconSvg({ round: true, scale: 0.64 })}\n`);

// PNG-in-ICO: header, directory entries, then the PNG payloads.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => icon(n)));
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((n, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(n, 0);
  e.writeUInt8(n, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
writeFileSync("app/favicon.ico", Buffer.concat([head, ...entries, ...pngs]));
await browser.close();
