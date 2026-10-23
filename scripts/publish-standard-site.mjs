/**
 * Creates the standard.site records for this site on your AT Protocol account and writes the resulting
 * AT-URIs to data/standard-site.json. Commit that file and deploy; the site then serves
 * /.well-known/site.standard.publication and the <link rel="site.standard.document"> tags.
 *
 *   BSKY_HANDLE=you.example.com BSKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx node scripts/publish-standard-site.mjs
 *
 * Use an app password (Bluesky Settings > Privacy and security > App passwords), never your main password.
 * Optional: BSKY_SERVICE (default https://bsky.social), SITE_URL, --dry-run to print the records only.
 * This publishes to a public network. Re-running skips records that already have a URI in the config file.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { AtpAgent } from "@atproto/api";

const dry = process.argv.includes("--dry-run");
const siteUrl = (process.env.SITE_URL ?? "https://paris.jazzsequence.com").replace(/\/$/, "");
const file = new URL("../data/standard-site.json", import.meta.url);
const config = JSON.parse(readFileSync(file, "utf8"));

const publication = {
  $type: "site.standard.publication",
  url: siteUrl,
  name: "PARIS",
  description: "Tour dates, music, lyrics and the album Well Enough.",
};

// Pages that are long-form documents. Add entries here to publish more.
const documents = [
  {
    path: "/press",
    record: {
      $type: "site.standard.document",
      title: "PARIS is Making Monsters Polite",
      path: "/press",
      publishedAt: new Date().toISOString(),
    },
  },
];

if (dry) {
  console.log(JSON.stringify({ publication, documents }, null, 2));
  process.exit(0);
}

const { BSKY_HANDLE, BSKY_APP_PASSWORD } = process.env;
if (!BSKY_HANDLE || !BSKY_APP_PASSWORD) {
  console.error("Set BSKY_HANDLE and BSKY_APP_PASSWORD (an app password).");
  process.exit(1);
}

const agent = new AtpAgent({ service: process.env.BSKY_SERVICE ?? "https://bsky.social" });
await agent.login({ identifier: BSKY_HANDLE, password: BSKY_APP_PASSWORD });
const repo = agent.session.did;

const create = async (collection, record) => {
  const res = await agent.com.atproto.repo.createRecord({ repo, collection, record });
  return res.data.uri;
};

if (!config.publication) {
  config.publication = await create("site.standard.publication", publication);
  console.log("publication:", config.publication);
}
for (const d of documents) {
  if (config.documents[d.path]) continue;
  config.documents[d.path] = await create("site.standard.document", { ...d.record, site: config.publication });
  console.log(`${d.path}:`, config.documents[d.path]);
}
writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log("Wrote data/standard-site.json. Commit it and deploy.");
