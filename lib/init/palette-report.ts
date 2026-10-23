/** A palette as /init-band shows it to the person choosing: each role with its contrast, after the gate, and what the gate changed. */
import { contrastRatio } from "../theme/contrast";
import { MIN_RATIO, PALETTE_KEYS, PaletteError, SURFACES, fmt, resolvePalette, type Palette, type PaletteKey } from "../theme/palette";

const ratio = (n: number) => `${fmt(n)}:1`;
const TEXT_ROLES: PaletteKey[] = ["text", "muted", "dim", "accent", "accent-2", "accent-3", "metal-hi", "metal-mid", "metal-lo"];
const FILLS: PaletteKey[] = ["accent", "accent-3", "metal-hi"];

export type PaletteReport = { ok: boolean; text: string };

export function paletteReport(input: Palette): PaletteReport {
  let resolved: ReturnType<typeof resolvePalette>;
  try {
    resolved = resolvePalette(input);
  } catch (e) {
    if (e instanceof PaletteError) return { ok: false, text: `REJECTED\n- ${e.problems.join("\n- ")}` };
    throw e;
  }
  const { palette, adjustments } = resolved;
  const rows = PALETTE_KEYS.map((key) => {
    const onSurfaces = SURFACES.map((s) => contrastRatio(palette[key], palette[s]));
    const text = TEXT_ROLES.includes(key) ? `${ratio(onSurfaces[1])} on surface, ${ratio(Math.min(...onSurfaces))} worst` : "";
    return `${key.padEnd(10)} ${palette[key]}  ${text}`.trimEnd();
  });
  const fills = FILLS.map((key) => `${key} ${ratio(contrastRatio(palette.void, palette[key]))}`).join(", ");
  const changed = adjustments.length
    ? adjustments.map((a) => `- ${a.key}: ${a.from} -> ${a.to} (${a.reason}); the hue is kept, only lightness moved`).join("\n")
    : "- none: every colour clears the gate as written";
  return {
    ok: true,
    text: `${rows.join("\n")}\n\nDark text on the fills that carry it: ${fills}\nThe gate needs ${MIN_RATIO}:1 for every text colour on all three surfaces. Adjusted by the gate:\n${changed}`,
  };
}
