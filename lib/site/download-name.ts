import { band } from "../band/config";

/**
 * File name offered when a track is downloaded: "<band name> - <title>.m4a". Keeps any script (so a non-Latin
 * title stays as written) and drops only punctuation that is unsafe or noisy in a file name. An ASCII-only
 * `\w` pattern would remove non-Latin titles entirely, leaving "<band name> - .m4a".
 */
const strip = (text: string) => text.replace(/[^\p{L}\p{N} .'’-]/gu, "").trim();

export function downloadFilename(title: string, extension: string): string {
  return `${strip(band.name)} - ${strip(title)}${extension}`;
}
