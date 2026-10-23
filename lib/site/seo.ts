import type { Metadata } from "next";

/**
 * Canonical origin. Test and dev environments also point canonical URLs at production, which keeps
 * duplicate copies out of search results; robots.txt additionally blocks every non-live environment.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://paris.jazzsequence.com").replace(/\/$/, "");
export const SITE_NAME = "PARIS";
export const DEFAULT_OG_IMAGE = "/og-default.jpg";

type PageMeta = {
  title: string;
  description: string;
  /** Path starting with "/", used for the canonical URL and og:url. */
  path: string;
  /** Path or absolute URL of a social image. Defaults to the site card. */
  image?: string;
  type?: "website" | "article" | "music.album" | "music.song";
  noindex?: boolean;
  /** Use the title as-is instead of the "%s · PARIS" template (home page). */
  absoluteTitle?: boolean;
};

/** Every page sets title, description, canonical and the full Open Graph set through this one function. */
export function pageMetadata({ title, description, path, image, type = "website", noindex, absoluteTitle }: PageMeta): Metadata {
  const images = [{ url: image ?? DEFAULT_OG_IMAGE, ...(image ? {} : { width: 1200, height: 630, alt: "PARIS" }) }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: absoluteTitle ? title : `${title} · ${SITE_NAME}`, description, url: path, type, siteName: SITE_NAME, images },
    twitter: { card: "summary_large_image", title: absoluteTitle ? title : `${title} · ${SITE_NAME}`, description, images: images.map((i) => i.url) },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`);

/** schema.org node for the artist, reused wherever a page needs `byArtist` or `performer`. */
export const artistNode = { "@type": "MusicGroup", "@id": `${SITE_URL}/#artist`, name: "PARIS", url: SITE_URL };
