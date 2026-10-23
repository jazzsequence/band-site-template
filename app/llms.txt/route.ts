import { albums } from "../../lib/site/catalog";
import { SITE_URL } from "../../lib/site/seo";

/** Plain-language map of the site for language-model tools (llmstxt.org convention). */
export function GET() {
  const body = [
    "# PARIS",
    "",
    "> Official site for PARIS: tour dates, music, lyrics, the album Well Enough, press and bio.",
    "",
    "## Pages",
    `- [Tour dates](${SITE_URL}/tour): venues, dates and tickets`,
    `- [Listen](${SITE_URL}/listen): stream and download`,
    `- [Albums](${SITE_URL}/albums): the full catalogue`,
    `- [Lyrics](${SITE_URL}/lyrics): every lyric`,
    `- [Press](${SITE_URL}/press): interview`,
    `- [Press kit](${SITE_URL}/press/kit): bios, quick facts, the band, selected press, photos and artwork`,
    `- [Bio](${SITE_URL}/bio)`,
    "",
    "## Albums",
    ...albums.map((a) => `- [${a.title}](${SITE_URL}${a.featured ? "/well-enough" : `/albums/${a.slug}`}): ${a.blurb}`),
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
