import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayerBar, type PlayerBarProps } from "../design-system/components/PlayerBar";

const base: PlayerBarProps = { title: "Say when", album: "Well Enough", cover: "images/well-enough-cover.jpg", elapsed: "0:10", duration: "3:00", progress: 5 };
const html = (props: Partial<PlayerBarProps>) => renderToStaticMarkup(<PlayerBar {...base} {...props} />);

describe("PlayerBar notice", () => {
  it("shows nothing until there is something to say", () => {
    expect(html({})).not.toContain("animate-notice-in");
  });

  it("shows the words it is given, for sighted users only", () => {
    const out = html({ notice: "Added Second Shift to the queue" });
    expect(out).toContain("Added Second Shift to the queue");
    // A live region elsewhere announces the same words, so the visual copy must not be read out twice.
    expect(out).toMatch(/<p[^>]*aria-hidden="true"[^>]*animate-notice-in/);
  });

  it("does not take clicks away from the controls under it", () => {
    expect(html({ notice: "Added" })).toContain("pointer-events-none");
  });
});
