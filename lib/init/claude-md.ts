/**
 * Rewrites CLAUDE.md for a configured band. The template's CLAUDE.md marks the text that only makes sense while the
 * repo is still the placeholder (the intro and first-run section, the placeholder note, the example-workflow
 * bullets) between <!-- template:NAME:start --> and <!-- template:NAME:end -->. Everything outside the markers is
 * the project's real rules and is left alone, so a new repo keeps them but not the template's own history.
 */
import type { FontFace, Typography } from "../theme/fonts";
import type { Adjustment } from "../theme/palette";
import type { Answers } from "./answers";

export type ClaudeMdContext = {
  answers: Answers;
  /** ISO date the setup ran. */
  date: string;
  adjustments: Adjustment[];
  offLimitsCount: number;
  installed: { deployedSite: boolean; registrySync: boolean };
};

const block = (name: string) => new RegExp(`<!-- template:${name}:start -->[\\s\\S]*?<!-- template:${name}:end -->`);

function replaceBlock(text: string, name: string, replacement: string): string {
  if (!block(name).test(text)) throw new Error(`CLAUDE.md has no template:${name} block to replace`);
  return text.replace(block(name), () => replacement.trimEnd());
}

const face = (f: FontFace) => `${f.family}${f.variable ? " (variable)" : ""}`;
const describeType = (t: Typography) =>
  `headings in ${face(t.display)}, body in ${face(t.body)}; the wordmark ${t.wordmark ? `in ${face(t.wordmark)}${t.wordmark.uppercase ? ", capitals" : ""}` : "uses the display face"}; kickers ${t.kicker ? `in ${face(t.kicker)}` : "use the display face"}`;

const FEATURE_LABELS = { tour: "Tour and tickets", merch: "Merch", lyrics: "Lyrics", map: "Tour map", press: "Press" } as const;

export function renderClaudeMd(template: string, ctx: ClaudeMdContext): string {
  const { answers: a, date, adjustments, offLimitsCount, installed } = ctx;
  const id = a.identity;
  const on = (Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]).filter((k) => a.features[k]).map((k) => FEATURE_LABELS[k]);
  const off = (Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]).filter((k) => !a.features[k]).map((k) => FEATURE_LABELS[k]);
  const host = a.hosting ?? {};

  const intro = `${id.name} ${id.fictional ? "(a fictional act)" : "site"}. ${id.genre}. Next.js 16 + P1 (Puck), deployed to Pantheon${host.pantheonSite ? ` (\`${host.pantheonSite}\`)` : ""}.
Everything band-specific comes from \`band.config.json\` (identity, which sections exist, type choices, palette, hosting, the location of the local
off-limits notes) plus content files under \`data/\` and \`content/\`.

**Editorial rule.** Public copy, metadata, alt text, code comments and docs must never state or hint at anything the band's off-limits list marks.
The list lives in the gitignored file named by \`editorial.offLimitsFile\` in \`band.config.json\` (\`docs/off-limits.md\`), never in a committed file,
because the list itself would give the topics away. It has ${offLimitsCount} ${offLimitsCount === 1 ? "entry" : "entries"}. The reviewer checks every commit against it. Keep backstory out of everything committed.

## Setup decisions

Recorded by \`/init-band\` on ${date}. Change them in \`band.config.json\` (then \`pnpm theme\` if the palette or type changed), not here; this list is the why.

- **Band:** ${id.name}${id.fictional ? ", a fictional act (pages never present it as real)" : ""}. ${id.tagline}
- **Sections on:** ${on.length ? on.join(", ") : "none"}.${off.length ? ` **Off:** ${off.join(", ")}; their routes return 404 and they drop out of the nav, sitemap and \`llms.txt\`.` : ""}
- **Type:** ${describeType(a.type)}.
- **Palette:** see \`band.config.json\`; the gate${adjustments.length ? ` lifted ${adjustments.map((x) => `\`${x.key}\``).join(", ")} for contrast (the config keeps the written value, the generated theme the lifted one)` : " needed no adjustments"}.
- **Hosting:** ${host.pantheonSite ? `Pantheon site \`${host.pantheonSite}\`` : "Pantheon site not set yet"}; ${host.p1SiteId ? `P1 site \`${host.p1SiteId}\`` : "P1 site not set yet"}; audio ${a.audio?.baseUrl ? `served from ${a.audio.baseUrl}` : "host not set yet (`NEXT_PUBLIC_AUDIO_BASE_URL`)"}.
- **Workflows installed:** ${[installed.deployedSite && "`test-deployed-site.yml`", installed.registrySync && "`sync-puck-registry.yml`"].filter(Boolean).join(", ") || "none yet (the examples are in `examples/workflows/`)"}.
- Secrets are never in files; see "Secrets on Pantheon" below for how each is set.`;

  const placeholders = `- **Placeholder content.** The albums, shows, lyrics, merch, bio and press article are still the template's neutral samples until the band replaces them (\`CONTENT.md\` says where).
  Images are solid-colour PNGs in the palette (\`node scripts/make-placeholder-images.mjs\`); icons and the social card are drawn from the band name and palette
  (\`node scripts/make-brand-assets.mjs\`). Both read the generated theme, so run \`pnpm theme\` first after changing the palette. The seeded tour has one on-sale and one sold-out date
  so both ticket pages stay covered by tests; the ticket flow (\`/tickets/[id]\` -> \`/ticket?...\`) keeps all state in the URL and collects nothing.${id.fictional ? " Tour dates are fictional and must never be presented as real." : " Real tour venues must be checked against a source before they are added."}`;

  const deployed = installed.deployedSite
    ? "- `test-deployed-site.yml`: waits for Pantheon to build `pr-N`/`dev`, then expects 200. Needs `PANTHEON_MACHINE_TOKEN` as an Actions and a Dependabot secret. Add it as a required check only once it passes."
    : "- `examples/workflows/test-deployed-site.yml`: not installed. Copy it to `.github/workflows/`, set `PANTHEON_SITE_NAME`, and add `PANTHEON_MACHINE_TOKEN` (Actions and Dependabot) to turn it on.";
  const sync = installed.registrySync
    ? "- `sync-puck-registry.yml`: syncs the Puck registry on pushes touching `components/puck/**`. Needs `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` as repo secrets, for this site's own P1 only; skipped for Dependabot pushes."
    : "- `examples/workflows/sync-puck-registry.yml`: not installed (no P1 site recorded yet). Install it once the site has its own P1 site and the three secrets; until then use `pnpm sync:registry` or the P1 MCP `sync_components`.";

  let out = template;
  out = replaceBlock(out, "intro", intro);
  out = replaceBlock(out, "placeholders", placeholders);
  out = replaceBlock(out, "workflow-sync", sync);
  out = replaceBlock(out, "workflow-deploy", deployed);
  if (/<!-- template:/.test(out)) throw new Error("CLAUDE.md still has an unreplaced template block");
  return out;
}
