// Runs after `next build`. Fails the build if a page that reads P1 content was not prerendered.
//
// Why: when P1 is unreachable or refuses the key at build time, the SDK's loadPublishedPage() calls connection(), which makes that route
// dynamic for the whole build. The build still succeeds, with only "[p1-next-sdk] published content unavailable for <path>" warnings, and
// the site then renders every request, sends `no-store` and calls P1 each time. That is what the live build did for days. A failed
// build keeps the previous good one running, which is the better outcome.
//
// Set ALLOW_DYNAMIC_P1_ROUTES=1 to ship anyway (for example to deploy while P1 is down).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// What reads P1 content (or the data its blocks need).
const READS_P1 = /\b(getP1Page|getShows|getSiteData|loadPublishedPage)\(/;

function pageFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return name === "page.tsx" ? [full] : [];
  });
}

/** Routes of the static pages under app/(site) that read P1. Dynamic segments and the test-only fixture route are left out. */
export function p1Routes(root) {
  const site = join(root, "app", "(site)");
  if (!existsSync(site)) return [];
  return pageFiles(site)
    .filter((file) => READS_P1.test(readFileSync(file, "utf-8")))
    .map((file) => "/" + relative(site, file).split("/").slice(0, -1).join("/"))
    .filter((route) => !route.includes("[") && !route.includes("e2e-fixtures"))
    .map((route) => (route === "/" ? route : route.replace(/\/$/, "")))
    .sort();
}

/** The routes among `routes` that the build did not prerender. */
export function notPrerendered(manifest, routes) {
  return routes.filter((route) => !(route in (manifest.routes ?? {})));
}

function main() {
  const rootFlag = process.argv.indexOf("--root");
  const root = resolve(rootFlag > -1 ? process.argv[rootFlag + 1] : process.cwd());
  const manifestPath = join(root, ".next", "prerender-manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`check-prerender: ${manifestPath} not found. Run it after \`next build\`.`);
    process.exit(2);
  }
  const routes = p1Routes(root);
  const missing = notPrerendered(JSON.parse(readFileSync(manifestPath, "utf-8")), routes);
  if (missing.length === 0) {
    console.log(`check-prerender: all ${routes.length} P1-backed routes were prerendered.`);
    return;
  }
  const list = missing.map((r) => `  ${r}`).join("\n");
  if (process.env.ALLOW_DYNAMIC_P1_ROUTES === "1") {
    console.warn(`check-prerender: these P1-backed routes are dynamic (allowed by ALLOW_DYNAMIC_P1_ROUTES=1):\n${list}`);
    return;
  }
  console.error(
    `check-prerender: these P1-backed routes were not prerendered, so the site would render every request uncached:\n${list}\n\n` +
      "Look above for `[p1-next-sdk] published content unavailable for <path>: <reason>`. \"Authentication required\" means the P1 key this build\n" +
      "used was refused (on live that must be CSS_API_KEY_LIVE; see lib/site/p1-key.ts). To ship anyway, set ALLOW_DYNAMIC_P1_ROUTES=1.",
  );
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
