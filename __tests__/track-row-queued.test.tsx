import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TrackRow } from "../design-system/components/TrackRow";

const row = (justQueued?: boolean) =>
  renderToStaticMarkup(<TrackRow number={2} title="Second Shift" duration="3:10" onQueue={() => {}} justQueued={justQueued} />);

describe("TrackRow just queued", () => {
  it("shows the plus until the track is added, then a check in the accent colour", () => {
    const before = row(false);
    const after = row(true);
    expect(before).toContain("M3 6h12M3 12h8");
    expect(before).not.toContain("text-magenta");
    expect(after).toContain("m5 12.5 4.5 4.5L19 7.5");
    expect(after).not.toContain("M3 6h12M3 12h8");
    expect(after).toContain("text-magenta");
  });

  it("keeps the same accessible name, so a screen reader is not told twice (the live region says it)", () => {
    expect(row(true)).toContain('aria-label="Add Second Shift to queue"');
    expect(row(false)).toContain('aria-label="Add Second Shift to queue"');
  });
});
