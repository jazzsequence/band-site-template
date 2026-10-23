import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayerBar, type PlayerBarProps } from "../design-system/components/PlayerBar";

const base: PlayerBarProps = { title: "Say when", album: "Well Enough", cover: "images/well-enough-cover.jpg", elapsed: "0:10", duration: "3:00", progress: 5 };
const html = (props: Partial<PlayerBarProps>) => renderToStaticMarkup(<PlayerBar {...base} {...props} />);
const noop = () => {};

describe("PlayerBar shuffle and repeat", () => {
  it("shows neither button until it is given a handler, so the bar looks as before elsewhere", () => {
    const out = html({});
    expect(out).not.toContain('aria-label="Shuffle"');
    expect(out).not.toContain("Repeat:");
  });

  it("shuffle is a toggle button that says whether it is on", () => {
    expect(html({ onShuffle: noop })).toContain('aria-label="Shuffle" aria-pressed="false"');
    expect(html({ onShuffle: noop, shuffle: true })).toContain('aria-label="Shuffle" aria-pressed="true"');
  });

  it("repeat names its current mode in words, not just by colour or icon", () => {
    expect(html({ onRepeat: noop })).toContain('aria-label="Repeat: off"');
    expect(html({ onRepeat: noop, repeat: "all" })).toContain('aria-label="Repeat: all"');
    expect(html({ onRepeat: noop, repeat: "one" })).toContain('aria-label="Repeat: this track"');
  });

  it("only repeat-one carries the 1 badge, and it is hidden from screen readers", () => {
    expect(html({ onRepeat: noop, repeat: "one" })).toMatch(/aria-hidden="true"[^>]*>1<\/span>/);
    expect(html({ onRepeat: noop, repeat: "all" })).not.toContain("text-[0.6rem]");
  });

  it("an active mode is marked with the accent colour as well as its label", () => {
    expect(html({ onShuffle: noop, shuffle: true })).toContain("text-magenta");
    expect(html({ onRepeat: noop, repeat: "off" })).not.toContain("text-magenta");
  });
});
