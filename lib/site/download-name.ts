/**
 * File name offered when a track is downloaded: "PARIS - <title>.m4a". Keeps any script (so a Korean
 * title stays Korean) and drops only punctuation that is unsafe or noisy in a file name. The previous
 * `\w` pattern is ASCII-only and removed non-Latin titles entirely, leaving "PARIS - .m4a".
 */
export function downloadFilename(title: string, extension: string): string {
  const clean = title.replace(/[^\p{L}\p{N} .'’-]/gu, "").trim();
  return `PARIS - ${clean}${extension}`;
}
