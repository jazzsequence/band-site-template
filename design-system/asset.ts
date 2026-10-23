/**
 * Per-build version for local images (`/images/...`). Pantheon's image layer (Cloudflare Image Resizing)
 * fetches each URL from the origin and caches a "not found" for any URL it asked for before a deploy had
 * the file, then keeps serving that miss to every browser that sends `Accept: image/webp`. A changed query
 * string is a new cache key, so versioning the URL per build makes a stale miss impossible. Absolute and
 * already-versioned URLs, and anything outside /images/, are left alone.
 */
const VERSION = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ASSET_VERSION : undefined;

export function assetUrl(src: string): string {
  if (!VERSION || !src.startsWith("/images/") || src.includes("?")) return src;
  return `${src}?v=${VERSION}`;
}
