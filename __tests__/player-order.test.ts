import { describe, expect, it } from "vitest";

import { neighbour, NEXT_REPEAT, playOrder, rankAfter, repeatLabel, rerank, type Ranked } from "../lib/site/player-order";

const slots = (...uids: string[]): Ranked[] => uids.map((uid, i) => ({ uid, rank: i / 10 }));
/** A random source that hands out the given numbers in turn. */
const seq = (...ns: number[]) => {
  let i = 0;
  return () => ns[i++ % ns.length];
};

describe("repeat cycle", () => {
  it("goes off, all, this track, off", () => {
    expect(NEXT_REPEAT.off).toBe("all");
    expect(NEXT_REPEAT.all).toBe("one");
    expect(NEXT_REPEAT.one).toBe("off");
  });

  it("is announced with the same words as the button label", () => {
    expect(repeatLabel("off")).toBe("Repeat: off");
    expect(repeatLabel("all")).toBe("Repeat: all");
    expect(repeatLabel("one")).toBe("Repeat: this track");
  });
});

describe("neighbour", () => {
  const order = slots("a", "b", "c");

  it("steps forward and back inside the queue", () => {
    expect(neighbour(order, "b", 1, false)?.uid).toBe("c");
    expect(neighbour(order, "b", -1, false)?.uid).toBe("a");
  });

  it("stops at either end when not wrapping", () => {
    expect(neighbour(order, "c", 1, false)).toBeUndefined();
    expect(neighbour(order, "a", -1, false)).toBeUndefined();
  });

  it("wraps from last to first and first to last when asked", () => {
    expect(neighbour(order, "c", 1, true)?.uid).toBe("a");
    expect(neighbour(order, "a", -1, true)?.uid).toBe("c");
  });

  it("a one-track queue wraps to itself", () => {
    expect(neighbour(slots("a"), "a", 1, true)?.uid).toBe("a");
    expect(neighbour(slots("a"), "a", 1, false)).toBeUndefined();
  });

  it("has no answer when the current track is not in the list", () => {
    expect(neighbour(order, "gone", 1, true)).toBeUndefined();
    expect(neighbour(order, undefined, 1, true)).toBeUndefined();
  });
});

describe("playOrder", () => {
  it("keeps the listed order when shuffle is off", () => {
    const list = [{ uid: "a", rank: 0.9 }, { uid: "b", rank: 0.1 }];
    expect(playOrder(list, false).map((s) => s.uid)).toEqual(["a", "b"]);
  });

  it("sorts by rank when shuffle is on, without touching the queue itself", () => {
    const list = [{ uid: "a", rank: 0.9 }, { uid: "b", rank: 0.1 }, { uid: "c", rank: 0.5 }];
    expect(playOrder(list, true).map((s) => s.uid)).toEqual(["b", "c", "a"]);
    expect(list.map((s) => s.uid)).toEqual(["a", "b", "c"]);
  });
});

describe("rerank", () => {
  it("puts the chosen track first and ranks the rest at random", () => {
    const out = rerank(slots("a", "b", "c", "d"), "c", seq(0.8, 0.2, 0.5));
    expect(playOrder(out, true).map((s) => s.uid)).toEqual(["c", "b", "d", "a"]);
  });

  it("leaves the queue's own order and every slot alone", () => {
    const out = rerank(slots("a", "b", "c"), "b");
    expect(out.map((s) => s.uid)).toEqual(["a", "b", "c"]);
  });

  it("every track is still in the shuffled order exactly once", () => {
    const uids = Array.from({ length: 20 }, (_, i) => `t${i}`);
    const out = playOrder(rerank(slots(...uids), "t7"), true).map((s) => s.uid);
    expect(out[0]).toBe("t7");
    expect([...out].sort()).toEqual([...uids].sort());
  });
});

describe("rankAfter", () => {
  it("lands after a track that is partway through the order", () => {
    for (const r of [0.01, 0.4, 0.9, 0.999]) expect(rankAfter(0.4, seq(r))).toBeGreaterThan(0.4);
  });

  it("is still a valid rank right after a rerank, when the loaded track is first", () => {
    const rank = rankAfter(-1, seq(0.5));
    expect(rank).toBeGreaterThanOrEqual(0);
    expect(rank).toBeLessThan(1);
  });

  it("a track queued mid-shuffle plays after the loaded one, not among those already played", () => {
    let list = rerank(slots("a", "b", "c", "d"), "b", seq(0.7, 0.3, 0.9));
    const loaded = playOrder(list, true)[2]; // two tracks have played, this is the third
    list = [...list, { uid: "new", rank: rankAfter(loaded.rank, seq(0.0001)) }];
    const order = playOrder(list, true).map((s) => s.uid);
    expect(order.indexOf("new")).toBeGreaterThan(order.indexOf(loaded.uid));
  });
});
