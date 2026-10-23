import type { RepeatMode } from "../../design-system/components/PlayerBar";

export const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

/** A queue slot. `rank` only matters while shuffle is on: the shuffled order is the slots sorted by rank. */
export type Ranked = { uid: string; rank: number };

type Random = () => number;

/**
 * Give every slot a fresh random rank, with `firstUid` ahead of all the others. Turning shuffle on, or picking a
 * track from the queue while it is on, starts a new order from that track, so nothing is left behind it.
 */
export function rerank<T extends Ranked>(slots: T[], firstUid: string | undefined, random: Random = Math.random): T[] {
  return slots.map((s) => ({ ...s, rank: s.uid === firstUid ? -1 : random() }));
}

/**
 * Rank for a slot added while shuffle may be on: somewhere after the track that is loaded, so it is still to come
 * and not among the tracks already played. The loaded track's own rank is -1 right after a rerank, hence the floor.
 */
export function rankAfter(currentRank: number | undefined, random: Random = Math.random): number {
  const floor = Math.max(currentRank ?? 0, 0);
  return floor + random() * (1 - floor);
}

/** The order tracks play in: the queue as listed, or by rank when shuffled. */
export function playOrder<T extends Ranked>(slots: T[], shuffle: boolean): T[] {
  return shuffle ? [...slots].sort((a, b) => a.rank - b.rank) : slots;
}

/**
 * The slot before or after `currentUid` in play order. Past either end it wraps round when `wrap` is set, and is
 * undefined otherwise. Undefined too when `currentUid` is not in the list.
 */
export function neighbour<T extends Ranked>(order: T[], currentUid: string | undefined, dir: 1 | -1, wrap: boolean): T | undefined {
  const i = order.findIndex((s) => s.uid === currentUid);
  if (i < 0) return undefined;
  const j = i + dir;
  if (j >= 0 && j < order.length) return order[j];
  return wrap ? order[(j + order.length) % order.length] : undefined;
}

/** What the live region says when the repeat button is pressed. Matches the button's own label. */
export const repeatLabel = (mode: RepeatMode) => `Repeat: ${mode === "one" ? "this track" : mode}`;
