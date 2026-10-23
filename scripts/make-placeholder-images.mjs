/**
 * Writes the neutral placeholder images a new band replaces: solid-colour PNGs in the site's own palette
 * (read from the generated theme, so run `pnpm theme` first after changing it). No dependencies.
 *
 *   node scripts/make-placeholder-images.mjs
 *
 * public/images/placeholder-cover.png     1024 x 1024  album cover art
 * public/images/placeholder-wide.png      1600 x 900   hero and gallery
 * public/images/placeholder-merch.png      800 x 800   merch
 * public/images/band-portrait.png         1024 x 1536  the band portrait (bio page, structured data)
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const theme = readFileSync("design-system/theme.generated.css", "utf8");
const token = (name) => {
  const hex = theme.match(new RegExp(`--color-${name}: #([0-9a-f]{6});`))?.[1];
  if (!hex) throw new Error(`--color-${name} not found in theme.generated.css; run pnpm theme`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
};

function solidPng(width, height, [r, g, b]) {
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set([r, g, b], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/images", { recursive: true });
const line = token("line");
const raised = token("raised");
for (const [file, w, h, colour] of [
  ["placeholder-cover.png", 1024, 1024, line],
  ["placeholder-wide.png", 1600, 900, raised],
  ["placeholder-merch.png", 800, 800, line],
  ["band-portrait.png", 1024, 1536, raised],
]) {
  writeFileSync(`public/images/${file}`, solidPng(w, h, colour));
  console.log(`wrote public/images/${file}`);
}
