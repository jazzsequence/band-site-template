import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const swatches = [
  ["void", "#07050d", "Page background"],
  ["surface", "#0e0a18", "Cards, header"],
  ["raised", "#17112a", "Raised panels"],
  ["line", "#2c2250", "Borders"],
  ["text", "#f5f0ff", "Body text (17.5:1)"],
  ["muted", "#b9aed6", "Secondary text (9.4:1)"],
  ["dim", "#8f84ad", "Tertiary, large only (5.7:1)"],
  ["magenta", "#ff3fa4", "Primary accent (6.0:1)"],
  ["violet", "#a98bff", "Links, labels (7.3:1)"],
  ["cyan", "#3ef0ff", "Focus, secondary actions (14.1:1)"],
] as const;

const meta = { title: "Foundations/Color and type", parameters: { layout: "padded" } } satisfies Meta;
export default meta;

export const Palette: StoryObj = {
  render: () => (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {swatches.map(([name, hex, note]) => (
        <li key={name} className="overflow-hidden rounded-card border border-line">
          <div className="h-20" style={{ background: hex }} />
          <div className="space-y-1 bg-surface p-3 text-sm">
            <p className="font-display text-xs uppercase tracking-widest">{name}</p>
            <p className="tabular-nums text-muted">{hex}</p>
            <p className="text-xs text-dim">{note}</p>
          </div>
        </li>
      ))}
    </ul>
  ),
};

export const Gradients: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="h-16 rounded-card" style={{ background: "var(--grad-neon)" }} />
      <div className="h-16 rounded-card" style={{ background: "var(--grad-chrome)" }} />
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Headings · Encode Sans Expanded 800, -0.04em</p>
        <p className="text-chrome font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]">Well Enough</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Wordmark · Unbounded, always capitals, -0.05em</p>
        <p className="font-wordmark text-5xl font-extrabold uppercase tracking-[-0.05em] text-text">Paris</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Accent · UnifrakturCook (kickers and flourishes only, never the PARIS name)</p>
        <p className="font-gothic text-4xl text-magenta">On the road</p>
      </div>
      <div className="max-w-xl">
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Body · Space Grotesk</p>
        <p className="text-lg leading-8">They sell you fear in holy clothes and call it protecting you. Body copy sits at 18px on a 32px line.</p>
      </div>
    </div>
  ),
};
