import type { MetadataRoute } from "next";

import { features } from "../lib/band/config";
import { albums } from "../lib/site/catalog";
import { getLyrics } from "../lib/site/lyrics";
import { SITE_URL } from "../lib/site/seo";
import { getShows } from "../lib/site/p1-content";

/** Every indexable public page. `/ticket` is excluded: it renders a private e-ticket from its URL. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lyrics, shows] = await Promise.all([features.lyrics ? getLyrics() : [], features.tour ? getShows() : []]);
  const paths = [
    "/",
    ...(features.tour ? ["/tour"] : []),
    "/listen",
    "/albums",
    ...(features.lyrics ? ["/lyrics"] : []),
    ...(features.press ? ["/press", "/press/kit"] : []),
    "/bio",
    ...(features.merch ? ["/merch"] : []),
    "/privacy",
    ...albums.map((a) => `/albums/${a.slug}`),
    ...lyrics.map((l) => `/lyrics/${l.slug}`),
    ...shows.map((s) => `/tickets/${s.id}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
