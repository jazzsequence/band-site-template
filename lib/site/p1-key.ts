/**
 * Which P1 API key this environment may use. The live site gets the published-only key
 * (`CSS_API_KEY_LIVE`) and never the drafts key, so an unpublished page cannot reach visitors.
 * Everywhere else uses `CSS_API_KEY`. On live a missing live key is an error, not a fallback:
 * falling back to the drafts key is exactly the leak this exists to prevent.
 */
type Env = Record<string, string | undefined>;

export const isLive = (env: Env = process.env) => env.PANTHEON_ENVIRONMENT === "live";

export function getP1ApiKey(env: Env = process.env): string | undefined {
  if (!isLive(env)) return env.CSS_API_KEY;
  const key = env.CSS_API_KEY_LIVE;
  if (!key) throw new Error("CSS_API_KEY_LIVE (the published-only P1 key) is required on the live environment.");
  return key;
}
