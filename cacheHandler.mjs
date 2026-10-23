// Pantheon persistent cache for ISR / route handlers. Loaded by Node at runtime
// from the standalone build, so it must be plain JS (.mjs), not TypeScript.
import { createCacheHandler } from "@pantheon-systems/nextjs-cache-handler";

export default createCacheHandler({
  type: "auto", // GCS when CACHE_BUCKET is set, otherwise file-based
});
