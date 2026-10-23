/**
 * Regenerates icons and the social card from the wordmark font. Run: node scripts/make-brand-assets.mjs
 *
 * app/   icon.png, icon.svg, apple-icon.png, favicon.ico   (Next file conventions)
 * public/icons/   icon-192.png, icon-512.png, icon-maskable-512.png   (referenced by app/manifest.ts)
 * public/og-default.jpg   1200x630 social card
 *
 * The mark is a bold "P" in Unbounded (the wordmark face) on the site's near-black with a magenta bar.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { chromium } from "@playwright/test";
import opentype from "opentype.js";

const require = createRequire(import.meta.url);
const unbounded = (file) =>
  path.join(path.dirname(require.resolve("@fontsource-variable/unbounded/package.json")), "files", file);
const fontData = readFileSync(unbounded("unbounded-latin-wght-normal.woff2")).toString("base64");
const photo = readFileSync("public/images/paris-on-stage.jpg").toString("base64");

const INK = "#07050d";
const CHROME = "#f1effa";
const MAGENTA = "#ff3fa4";

const fontFace = `@font-face { font-family: U; src: url(data:font/woff2;base64,${fontData}); font-weight: 200 900; }`;

const iconHtml = (size, { round, scale }) => `<!doctype html><meta charset="utf-8"><style>
  ${fontFace}
  html, body { margin: 0; background: transparent; }
  .icon { width: ${size}px; height: ${size}px; background: ${INK}; position: relative; overflow: hidden;
    display: grid; place-items: center; border-radius: ${round ? size * 0.2 : 0}px; }
  .icon span { font: 800 ${size * scale}px/1 U; color: ${CHROME}; letter-spacing: -0.05em; transform: translate(-1%, -6%); }
  .icon i { position: absolute; left: 0; right: 0; bottom: 0; height: ${size * 0.13}px; background: ${MAGENTA}; }
</style><div class="icon"><span>P</span><i></i></div>`;

const ogHtml = `<!doctype html><meta charset="utf-8"><style>
  ${fontFace}
  html, body { margin: 0; }
  .card { width: 1200px; height: 630px; position: relative; overflow: hidden; background: ${INK}; }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 6%; }
  .card .shade { position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(7,5,13,.92) 0%, rgba(7,5,13,.55) 38%, rgba(7,5,13,0) 68%),
                linear-gradient(0deg, rgba(7,5,13,.85) 0%, rgba(7,5,13,0) 40%); }
  .card h1 { position: absolute; left: 72px; bottom: 64px; margin: 0; font: 800 168px/1 U; letter-spacing: -0.05em; color: ${CHROME}; }
  .card .bar { position: absolute; left: 72px; bottom: 40px; width: 150px; height: 8px; background: ${MAGENTA}; }
</style><div class="card"><img src="data:image/jpeg;base64,${photo}"><div class="shade"></div><h1>PARIS</h1><div class="bar"></div></div>`;

const browser = await chromium.launch();
const shoot = async (html, w, h, selector) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.load("800 64px U"));
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.locator(selector).screenshot({ omitBackground: true, type: selector === ".card" ? "jpeg" : "png", ...(selector === ".card" ? { quality: 88 } : {}) });
  await page.close();
  return buf;
};
// Rounded icons carry an alpha channel, which Next requires for the PNGs inside favicon.ico.
const icon = (size, opts = { round: true, scale: 0.64 }) => shoot(iconHtml(size, opts), size, size, ".icon");

mkdirSync("public/icons", { recursive: true });
writeFileSync("app/icon.png", await icon(512));
writeFileSync("app/apple-icon.png", await icon(180, { round: false, scale: 0.64 }));
writeFileSync("public/icons/icon-192.png", await icon(192));
writeFileSync("public/icons/icon-512.png", await icon(512));
// Maskable: full bleed, with the mark inside the central 80% safe zone.
writeFileSync("public/icons/icon-maskable-512.png", await icon(512, { round: false, scale: 0.5 }));
writeFileSync("public/og-default.jpg", await shoot(ogHtml, 1200, 630, ".card"));

// SVG favicon: outline the glyph so it does not depend on the font being installed.
// opentype.js reads WOFF but not WOFF2, so this uses the static 800 weight from @fontsource/unbounded.
const staticFont = path.join(
  path.dirname(require.resolve("@fontsource/unbounded/package.json")),
  "files/unbounded-latin-800-normal.woff",
);
const raw = readFileSync(staticFont);
const font = opentype.parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
const fontSize = 512 * 0.64;
const glyph = font.getPath("P", 0, 0, fontSize);
const box = glyph.getBoundingBox();
// Centre horizontally, and sit slightly above centre to leave room for the bar (matches the PNGs).
const dx = (512 - (box.x2 - box.x1)) / 2 - box.x1 - 512 * 0.01;
const dy = (512 - (box.y2 - box.y1)) / 2 - box.y1 - 512 * 0.06;
glyph.commands.forEach((c) => {
  for (const k of ["x", "x1", "x2"]) if (k in c) c[k] += dx;
  for (const k of ["y", "y1", "y2"]) if (k in c) c[k] += dy;
});
writeFileSync(
  "app/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>PARIS</title>` +
    `<clipPath id="r"><rect width="512" height="512" rx="102"/></clipPath>` +
    `<g clip-path="url(#r)"><rect width="512" height="512" fill="${INK}"/>` +
    `<path d="${glyph.toPathData(2)}" fill="${CHROME}"/>` +
    `<rect y="445" width="512" height="67" fill="${MAGENTA}"/></g></svg>\n`,
);

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
