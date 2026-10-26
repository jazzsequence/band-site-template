import { band } from "../band/config";

/**
 * Drops the characters that are unsafe or noisy in a file name and keeps any script, so a non-Latin title stays as
 * written. An ASCII-only `\w` pattern would remove non-Latin titles entirely and leave nothing but the band name.
 */
export const fileSafe = (text: string) => text.replace(/[^\p{L}\p{N} .'’-]/gu, "").trim();

/** File name offered when a track is downloaded: "<band name> - <title>.m4a". */
export function downloadFilename(title: string, extension: string): string {
  return `${fileSafe(band.name)} - ${fileSafe(title)}${extension}`;
}
