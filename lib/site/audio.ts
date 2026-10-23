import { AwsClient } from "aws4fetch";

/**
 * Lists object keys in the audio bucket via the R2 S3 API (read-only token, server-side only).
 * Cached via fetch revalidation so uploads show up within a few minutes without a deploy.
 * If credentials are missing or the call fails, no track is treated as available: the UI
 * shows "Audio unavailable" rather than a dead player.
 */
export const AUDIO_REVALIDATE_SECONDS = 300;

export async function listAudioKeys(): Promise<Set<string>> {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return new Set();

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const keys = new Set<string>();
  let token: string | undefined;
  try {
    do {
      const url = new URL(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`);
      url.searchParams.set("list-type", "2");
      if (token) url.searchParams.set("continuation-token", token);
      const res = await client.fetch(url, { next: { revalidate: AUDIO_REVALIDATE_SECONDS } });
      if (!res.ok) throw new Error(`R2 list failed: ${res.status}`);
      const xml = await res.text();
      for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.add(m[1]);
      token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
        ? xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1]
        : undefined;
    } while (token);
  } catch (err) {
    console.error("[audio] could not list bucket:", err instanceof Error ? err.message : err);
    return new Set();
  }
  return keys;
}
