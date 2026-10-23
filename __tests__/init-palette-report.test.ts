import { describe, expect, it } from "vitest";

import { suggestPalette } from "../lib/init/palette-suggest";
import { paletteReport } from "../lib/init/palette-report";

describe("paletteReport", () => {
  it("lists every role with its ratios and says when nothing needed adjusting", () => {
    const { ok, text } = paletteReport(suggestPalette({ hue: 150 }));
    expect(ok).toBe(true);
    for (const role of ["void", "surface", "raised", "line", "text", "muted", "dim", "accent", "accent-2", "accent-3", "metal-hi", "metal-mid", "metal-lo"]) {
      expect(text, role).toContain(role);
    }
    expect(text).toMatch(/text\s+#[0-9a-f]{6}\s+\d+\.\d:1 on surface, \d+\.\d:1 worst/);
    expect(text).toContain("Dark text on the fills that carry it: accent");
    expect(text).toContain("needs 4.5:1");
    expect(text).toContain("none: every colour clears the gate as written");
    expect(text).not.toContain("the hue is kept");
  });

  it("names what the gate lifted and promises the hue is kept", () => {
    const p = { ...suggestPalette({ hue: 150 }), accent: "#2a5a40" };
    const { ok, text } = paletteReport(p);
    expect(ok).toBe(true);
    expect(text).toMatch(/- accent: #2a5a40 -> #[0-9a-f]{6} \(\d+\.\d:1 on raised, needs 4\.5:1\); the hue is kept/);
    // The report shows the colour the site will actually use.
    expect(text).not.toMatch(/accent\s+#2a5a40/);
  });

  it("reports a palette the gate rejects, with the reason, instead of throwing", () => {
    const { ok, text } = paletteReport({ ...suggestPalette({ hue: 150 }), surface: "#f0f0f0" });
    expect(ok).toBe(false);
    expect(text).toMatch(/^REJECTED\n- palette\.surface .* too light/);
  });
});
