/**
 * Runs once when the server starts. The P1 SDK reads `CSS_API_KEY` from the environment for published
 * pages, so on live this swaps in the published-only key before any request is served (see lib/site/p1-key.ts).
 * It throws on live without `CSS_API_KEY_LIVE`: the site should refuse to start rather than serve drafts.
 * The build makes the same swap in next.config.ts, because this file does not run during `next build`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { applyP1ApiKey } = await import("./lib/site/p1-key");
  applyP1ApiKey();
}
