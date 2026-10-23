import { getCatalog, type CatalogAlbum } from "./catalog";
import { getLyrics } from "./lyrics";
import { getShows } from "./p1-content";
import type { Show } from "./tour";

export type LyricSummary = { slug: string; title: string; album?: string; track?: number };

/** Everything the catalog-driven P1 blocks (track lists, album grid, tour preview, lyrics index) need. */
export type SiteData = { albums: CatalogAlbum[]; shows: Show[]; lyrics: LyricSummary[] };

export async function getSiteData(): Promise<SiteData> {
  const [albums, shows, lyrics] = await Promise.all([getCatalog(), getShows(), getLyrics()]);
  return { albums, shows, lyrics: lyrics.map(({ slug, title, album, track }) => ({ slug, title, album, track })) };
}
