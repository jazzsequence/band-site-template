/**
 * Runs once when the server starts. The P1 SDK reads `CSS_API_KEY` from the environment for published
 * pages, so on live this swaps in the published-only key before any request is served (see lib/site/p1-key.ts).
 * It throws on live without `CSS_API_KEY_LIVE`: the site should refuse to start rather than serve drafts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getP1ApiKey, isLive } = await import("./lib/site/p1-key");
  const key = getP1ApiKey();
  if (isLive() && key) process.env.CSS_API_KEY = key;
}
