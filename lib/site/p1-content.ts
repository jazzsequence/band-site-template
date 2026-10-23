import { loadPublishedPage } from "@pantheon-systems/p1-next-sdk/server";
import type { Data } from "@puckeditor/core";

import { isP1Configured } from "./p1-config";
import { normalizeShows, shows as repoShows, type Show } from "./tour";

/**
 * Published P1 page for `path`, or null when there is none or P1 cannot be reached. Pages treat null as
 * "use the copy in this repo", so the site keeps working, and CI keeps passing, without P1.
 */
export async function getP1Page(path: string): Promise<Data | null> {
  // Placeholder credentials (CI, e2e, local checks) must not reach the real P1 backend. See p1-config.ts.
  if (!isP1Configured()) return null;
  const result = await loadPublishedPage(path);
  if (result.status !== "ok") return null;
  // The site was created with a starter "Welcome to your new P1 site" home page. It is not content.
  return isStarterPage(result.data) ? null : result.data;
}

export const isStarterPage = (data: Data) => (data.content as { type?: string }[]).some((b) => b.type === "P1WelcomeBlock");

type Block = { type?: string; props?: Record<string, unknown> };

/** Props of the first block of `type`, searching top-level content and every zone. */
export function findBlockProps(data: Data | null, type: string): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const blocks: Block[] = [...(data.content as Block[]), ...Object.values(data.zones ?? {}).flat()];
  return blocks.find((b) => b.type === type)?.props;
}

export const rootProp = (data: Data | null, key: "title" | "description"): string | undefined => {
  const v = (data?.root as { props?: Record<string, unknown> } | undefined)?.props?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};

/** The tour: the TourDatesBlock on the published /tour page, else the dates in data/tour.json. */
export async function getShows(): Promise<Show[]> {
  const fromP1 = normalizeShows(findBlockProps(await getP1Page("/tour"), "TourDatesBlock")?.items);
  return fromP1.length > 0 ? fromP1 : repoShows;
}

export async function getShowById(id: string): Promise<Show | undefined> {
  return (await getShows()).find((s) => s.id === id);
}
