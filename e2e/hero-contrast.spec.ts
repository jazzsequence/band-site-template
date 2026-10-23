import sharp from "sharp";
import { expect, test } from "@playwright/test";

/**
 * Text over the hero photo can't be checked by axe (it can't see through an image). This renders the page
 * with the text hidden, samples the pixels that were behind each piece of text, and computes the WCAG
 * contrast ratio of the text colour against them. It asserts on the 5th percentile: the worst 5% of the
 * area behind the text, which is what a reader meets when a bright stage light sits behind a letter.
 */
const SIZES: [number, number][] = [[360, 640], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]];
const NEED = { kicker: 3, title: 3, blurb: 4.5 } as const; // large text 3:1, body text 4.5:1
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const TEXT: Record<string, number[]> = { kicker: hex("#ff3fa4"), title: hex("#8d8aa6") }; // title is a chrome gradient: its darkest stop is the worst case

const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test.skip(({ isMobile }) => isMobile === true, "sets its own viewports");

test("text over the hero photo meets contrast at every screen size", async ({ page }) => {
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await page.waitForSelector("section h1");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))));

    const boxes = await page.evaluate(() => {
      const hero = document.querySelector("section")!;
      const els: Record<string, Element | undefined> = {
        kicker: hero.querySelector("p.font-gothic") ?? undefined,
        blurb: [...hero.querySelectorAll("p")].find((e) => !e.classList.contains("font-gothic")),
        title: hero.querySelector("h1") ?? undefined,
      };
      const out: Record<string, { x: number; y: number; w: number; h: number; color: string }> = {};
      for (const [k, el] of Object.entries(els)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        out[k] = { x: r.x, y: r.y + scrollY, w: r.width, h: r.height, color: getComputedStyle(el).color };
      }
      return out;
    });
    expect(Object.keys(boxes).sort(), `${w}x${h}: hero text not found`).toEqual(["blurb", "kicker", "title"]);

    await page.addStyleTag({
      content:
        "section h1, section p, section a { color: transparent !important; -webkit-text-fill-color: transparent !important; background-image: none !important; box-shadow: none !important; } section a { background: transparent !important; border-color: transparent !important; }",
    });
    const { data, info } = await sharp(await page.screenshot({ fullPage: true })).raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => {
      const i = (Math.min(Math.round(y), info.height - 1) * info.width + Math.min(Math.round(x), info.width - 1)) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };

    for (const [k, r] of Object.entries(boxes)) {
      const textRgb = TEXT[k] ?? (r.color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      const vals: number[] = [];
      for (let y = r.y; y < r.y + r.h; y += 3) for (let x = r.x; x < r.x + r.w; x += 3) vals.push(ratio(textRgb, px(x, y)));
      vals.sort((a, b) => a - b);
      const p5 = vals[Math.floor(vals.length * 0.05)];
      expect(p5, `${w}x${h} ${k}: worst-5% contrast ${p5.toFixed(1)}:1, needs ${NEED[k as keyof typeof NEED]}:1`).toBeGreaterThanOrEqual(NEED[k as keyof typeof NEED]);
    }
  }
});

/**
 * The hero photo is a portrait cropped into a landscape frame, so on laptop-sized screens the face sits right
 * where a block of text wants to go. This works out where the face lands from the image's own crop (object-cover,
 * 50% / 6%) and asserts the card and text stay clear of it.
 */
const FACE = { x0: 0.38, x1: 0.62, y0: 0.13, y1: 0.29 }; // fractions of the photo: forehead to chin
const FACE_SIZES: [number, number][] = [[768, 1024], [1024, 768], [1100, 700], [1180, 820], [1280, 720], [1280, 800], [1366, 768], [1440, 900], [1536, 864], [1920, 1080]];

test("the hero text never covers the face", async ({ page }) => {
  for (const [w, h] of FACE_SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await page.waitForSelector("section h1");
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))));

    const { face, covers } = await page.evaluate((f) => {
      const hero = document.querySelector("section")!;
      const img = hero.querySelector("img")!.getBoundingClientRect();
      const scale = Math.max(img.width / 1024, img.height / 1536);
      const rw = 1024 * scale;
      const rh = 1536 * scale;
      const ox = img.left + (img.width - rw) * 0.5;
      const oy = img.top + (img.height - rh) * 0.06;
      const face = { l: ox + rw * f.x0, r: ox + rw * f.x1, t: oy + rh * f.y0, b: oy + rh * f.y1 };
      const card = hero.querySelector("h1")!.parentElement!;
      // From 2xl the card has no background; the text itself is what's over the photo.
      const boxed = getComputedStyle(card).backgroundColor !== "rgba(0, 0, 0, 0)";
      // Measure the text itself, not its block: a paragraph's box is wider than the words in it.
      const rect = (e: Element) => {
        const range = document.createRange();
        range.selectNodeContents(e);
        return range.getBoundingClientRect();
      };
      const rects = boxed ? [card.getBoundingClientRect()] : [...card.querySelectorAll("p, h1, a")].map(rect);
      return { face, covers: rects.map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom })) };
    }, FACE);

    for (const c of covers) {
      const overlaps = c.l < face.r && c.r > face.l && c.t < face.b && c.b > face.t;
      expect(overlaps, `${w}x${h}: hero text box ${JSON.stringify(c)} overlaps the face ${JSON.stringify(face)}`).toBe(false);
    }
  }
});
