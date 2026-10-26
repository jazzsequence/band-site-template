import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import config from "../band.config.json";
import { typography } from "../lib/band/config";
import { contrastRatio } from "../lib/theme/contrast";
import { pickWeights, WANTED_WEIGHTS } from "../lib/theme/fonts";
import { MIN_RATIO, PALETTE_KEYS, checkPalette, resolvePalette, validatePalette, type Palette as PaletteMap, type PaletteKey } from "../lib/theme/palette";
import { Wordmark } from "./components/Wordmark";

// The palette this story shows is the one the generator emits (band.config.json after the contrast gate),
// so the swatches and ratios cannot drift from the real tokens.
const { palette, adjustments } = resolvePalette(validatePalette(config.palette));

const NOTES: Record<PaletteKey, string> = {
  void: "Page background",
  surface: "Cards, header",
  raised: "Raised panels",
  line: "Borders",
  text: "Body text",
  muted: "Secondary text",
  dim: "Tertiary text",
  accent: "Primary accent",
  "accent-2": "Links, labels",
  "accent-3": "Focus, secondary actions",
  "metal-hi": "Metal, bright",
  "metal-mid": "Metal, gradient mid",
  "metal-lo": "Metal, dark",
};

const ratio = (a: string, b: string) => `${(Math.floor(contrastRatio(a, b) * 10) / 10).toFixed(1)}:1`;

const meta = { title: "Foundations/Color and type", parameters: { layout: "padded" } } satisfies Meta;
export default meta;

export const Palette: StoryObj = {
  render: () => (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {PALETTE_KEYS.map((name) => (
        <li key={name} className="overflow-hidden rounded-card border border-line">
          <div className="h-20" style={{ background: `var(--color-${name})` }} />
          <div className="space-y-1 bg-surface p-3 text-sm">
            <p className="font-display text-xs uppercase tracking-widest">{name}</p>
            <p className="tabular-nums text-muted">{palette[name]}</p>
            <p className="text-xs text-dim">
              {NOTES[name]}
              {name !== "void" && name !== "surface" && name !== "raised" && name !== "line" ? ` (${ratio(palette[name], palette.surface)} on surface)` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  ),
};

function PairTable({ pal }: { pal: PaletteMap }) {
  const results = checkPalette(pal);
  return (
    <table className="w-full max-w-3xl text-left text-sm">
      <caption className="mb-2 text-left text-xs uppercase tracking-widest text-dim">
        Every pair the generator gates on, against WCAG AA ({MIN_RATIO}:1)
      </caption>
      <thead>
        <tr className="text-xs uppercase tracking-widest text-dim">
          <th scope="col" className="py-1 pr-4 font-normal">Text or fill</th>
          <th scope="col" className="py-1 pr-4 font-normal">On</th>
          <th scope="col" className="py-1 pr-4 font-normal">Ratio</th>
          <th scope="col" className="py-1 font-normal">AA</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={`${r.fg}-${r.bg}`} className="border-t border-line">
            <td className="py-1 pr-4">
              <span aria-hidden className="mr-2 inline-block size-3 border border-line align-middle" style={{ background: pal[r.fg] }} />
              {r.fg}
            </td>
            <td className="py-1 pr-4 text-muted">{r.bg}</td>
            <td className="py-1 pr-4 tabular-nums">{ratio(pal[r.fg], pal[r.bg])}</td>
            <td className="py-1">{r.ok ? "Pass" : "Fail"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const Contrast: StoryObj = {
  name: "Contrast (active palette)",
  render: () => (
    <div className="space-y-4">
      {adjustments.length > 0 ? (
        <ul className="text-sm text-muted">
          {adjustments.map((a) => (
            <li key={a.key}>
              {a.key} lifted from {a.from} to {a.to} ({a.reason})
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No colour needed adjusting: band.config.json passes as written.</p>
      )}
      <PairTable pal={palette} />
    </div>
  ),
};

// A deliberately dim palette, to show what the gate does to a colour that fails: same hue, lifted just enough.
const dim = resolvePalette({ ...palette, accent: "#7a1450", "accent-3": "#1d6f78", dim: "#4a4468" });

export const AdjustedExample: StoryObj = {
  name: "Contrast (a failing palette, repaired)",
  render: () => (
    <div className="space-y-4">
      <ul className="text-sm text-muted">
        {dim.adjustments.map((a) => (
          <li key={a.key} className="flex items-center gap-3">
            <span aria-hidden className="inline-block size-4 border border-line" style={{ background: a.from }} />
            <span aria-hidden>→</span>
            <span aria-hidden className="inline-block size-4 border border-line" style={{ background: a.to }} />
            {a.key}: {a.from} to {a.to} ({a.reason})
          </li>
        ))}
      </ul>
      <PairTable pal={dim.palette} />
    </div>
  ),
};

export const Gradients: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="h-16 rounded-card" style={{ background: "var(--grad-accent)" }} />
      <div className="h-16 rounded-card" style={{ background: "var(--grad-metal)" }} />
    </div>
  ),
};

// What a face is called in the captions: its name and the weights the site ships (a variable face ships its whole range).
const faceNote = (role: "display" | "body" | "wordmark" | "kicker") => {
  const face = typography[role];
  if (!face) return null;
  return `${face.family}${face.variable ? ", variable" : `, ${pickWeights(face.weights, WANTED_WEIGHTS[role]).join("/")}`}`;
};

export const Typography: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Headings · {faceNote("display")}, -0.04em (typography.display in band.config.json)</p>
        <p className="text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]">Placeholder heading</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Wordmark · {typography.wordmark ? `${faceNote("wordmark")}${typography.wordmark.uppercase ? ", capitals" : ""}, -0.05em` : "the display face, as typed"} (typography.wordmark in band.config.json)
        </p>
        <Wordmark size="lg" />
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Kickers · {typography.kicker ? `${faceNote("kicker")}, for kickers and flourishes only` : "the display face"} (typography.kicker in band.config.json)
        </p>
        <p className="font-kicker text-4xl text-accent">On the road</p>
      </div>
      <div className="max-w-xl">
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Body · {faceNote("body")} (typography.body in band.config.json)</p>
        <p className="text-lg leading-8">Placeholder body copy sits at 18px on a 32px line. Replace this sentence with a longer one to judge line length and rhythm.</p>
      </div>
    </div>
  ),
};
