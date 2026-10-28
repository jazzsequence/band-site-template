/**
 * P1 media (media.p1.pantheon.io, which redirects to pantheon-files.com) serves an upload at its original size unless the URL asks for
 * less. Measured on /bio: `?fit=scale-down` alone returned a 1.7 MB WebP for a photo drawn about 350 px wide; the same photo with
 * `width=800` is 66 KB (AVIF, negotiated from the Accept header). Only the host's own transform parameters are used, so a URL that
 * is not P1 media (a local /images file, another site) is returned untouched.
 *
 * This is deliberately not `buildImageUrl` from @pantheon-systems/p1-media: that package's entry also carries the editor plugin, which
 * the public pages should not download.
 */
const MEDIA_HOSTS = new Set(["media.p1.pantheon.io", "pantheon-files.com"]);

/** `url` asking P1 media for an image at most `width` pixels wide. Anything that is not a P1 media URL, or already sets a width, is returned as it was. */
export function mediaUrl(url: string | undefined, width: number): string {
  if (!url) return "";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "https:" || !MEDIA_HOSTS.has(parsed.hostname) || parsed.searchParams.has("width")) return url;
  parsed.searchParams.set("width", String(width));
  return parsed.toString();
}
