import type { MetadataRoute } from "next";

import { albums } from "../lib/site/catalog";
import { getLyrics } from "../lib/site/lyrics";
import { SITE_URL } from "../lib/site/seo";
import { getShows } from "../lib/site/p1-content";

/** Every indexable public page. `/ticket` is excluded: it renders a private e-ticket from its URL. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lyrics, shows] = await Promise.all([getLyrics(), getShows()]);
  const paths = [
    "/",
    "/tour",
    "/listen",
    "/albums",
    "/well-enough",
    "/lyrics",
    "/press",
    "/press/kit",
    "/bio",
    "/merch",
    "/privacy",
    ...albums.filter((a) => !a.featured).map((a) => `/albums/${a.slug}`),
    ...lyrics.map((l) => `/lyrics/${l.slug}`),
    ...shows.map((s) => `/tickets/${s.id}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
