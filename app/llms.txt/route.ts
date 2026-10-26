import { band, features } from "../../lib/band/config";
import { albums } from "../../lib/site/catalog";
import { SITE_URL } from "../../lib/site/seo";

/** Plain-language map of the site for language-model tools (llmstxt.org convention). */
export function GET() {
  const pages = [
    features.tour && `- [Tour dates](${SITE_URL}/tour): venues, dates and tickets`,
    `- [Listen](${SITE_URL}/listen): stream and download`,
    `- [Albums](${SITE_URL}/albums): the full catalogue`,
    features.lyrics && `- [Lyrics](${SITE_URL}/lyrics): every lyric`,
    features.press && `- [Press](${SITE_URL}/press): interviews and reviews`,
    features.press && `- [Press kit](${SITE_URL}/press/kit): bios, quick facts, photos and artwork`,
    `- [Bio](${SITE_URL}/bio)`,
  ].filter(Boolean);
  const body = [
    `# ${band.name}`,
    "",
    `> ${band.tagline}`,
    "",
    "## Pages",
    ...pages,
    "",
    "## Albums",
    ...albums.map((a) => `- [${a.title}](${SITE_URL}/albums/${a.slug}): ${a.blurb}`),
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
