# CLAUDE.md

<!-- template:intro:start -->
Band site template. Next.js 16 + P1 (Puck), deployed to Pantheon. Everything band-specific comes from `band.config.json` (identity, which
sections exist, type choices, palette, the location of the local off-limits notes, hosting) plus content files under `data/` and `content/`.
It ships with a clearly fake placeholder band ("Your Band") that a new band overwrites; it came out of a production site, whose
palette survives only as the generator's regression fixture.

**Editorial rule.** Public copy, metadata, alt text, code comments and docs must never state or hint at anything the band's off-limits list marks.
The list lives in the gitignored file named by `editorial.offLimitsFile` in `band.config.json` (default `docs/off-limits.md`), never in a committed file,
because the list itself would give the topics away. The reviewer checks every commit against it. Keep backstory out of everything committed.

## First run

`band.config.json` has `"setup": { "initialized": false }` in the template. **If it is false, this repo is still the placeholder band: run the `/init-band` skill
(`.claude/skills/init-band/`) before doing anything else, and do not edit around the placeholder.** It asks about the band in batches (identity, look,
type, features and audio, hosting), proposes palettes with real contrast ratios, writes `band.config.json`, regenerates the theme, images and icons, writes the
local off-limits notes, installs the example workflows, and rewrites this file for the band. Secrets are never collected in chat: it hands you commands that prompt
for each value. It sets `setup.initialized` to true when it is done, and removes this section and the other template-only text from this file.
<!-- template:intro:end -->

## Commit review (reviewer agent)

Installed from https://github.com/jazzsequence/claude-code-reviewer. Every commit of AI-written code needs an
approval from the `reviewer` subagent first; a PreToolUse hook (`.claude/helpers/hook-handler.cjs`) and a git
pre-commit hook (`.githooks/pre-commit`, config in `.reviewer-config.sh`) block the commit otherwise.

1. Stage the change (`git add`), then spawn the reviewer: `Agent({ subagent_type: "reviewer", prompt: "<what changed and why>" })`.
2. Describe the change factually. Never tell the reviewer to approve, and never write `reviewer-approved` myself.
3. On APPROVE, commit within 5 minutes and without touching the index again (the approval is bound to the staged content).
   On REJECT, fix and request a fresh review.
4. `USER_COMMIT=1` is for commits the owner writes by hand. Claude never uses it; if the reviewer is unavailable or blocks
   something wrong, stop and ask the owner.

How this fits the rest of this file:
- The reviewer is the commit gate. It does not replace the PR, the Storybook approval for `design-system/` (see below),
  or CI. Open PRs from feature branches cut from a freshly pulled `main` (`git checkout main && git pull`, not just a fetch; this includes design branches, see below); the owner merges.
- Per commit the hook runs `pnpm test`, `pnpm lint && pnpm typecheck` and `pnpm build` (`.reviewer-config.sh`; the generated defaults were npm
  and would have failed). Docs-only commits (`.md`, `.mdx`, `.txt`, `.rst`) and commits touching only `.claude/` or `.githooks/` skip all of
  that (`REVIEWER_TEXT_ONLY_PATTERN`, and the reviewer's own skip rule matches); they still need the reviewer's checklist. e2e is not in
  the hook (needs a fresh build and port 3100; CI runs it on every PR): run `pnpm test:e2e` myself before opening a PR, and the reviewer
  runs it too when `e2e/`, `app/` routes or `design-system/` change.
- Reviewer files are committed: `.claude/agents/reviewer.md`, `.claude/helpers/hook-handler.cjs`, `.claude/settings.json`,
  `.githooks/`, `.reviewer-config.sh`, and the checklist at `.claude/REVIEWER_CHECKLIST.md` (moved out of the gitignored `docs/`).
  The checklist's "Project-specific checks" section holds this repo's rules: the editorial rule (against the local off-limits list), the design-system gate (story at the
  relevant sizes, flagged for the owner's Storybook approval), docs/a11y, and P1 content and key rules. Edit it when a rule changes.
  Re-running the upstream `install.sh` will not overwrite the config or checklist, but will flag `reviewer.md` as locally modified (it writes the approval flag to `<repo root>/reviewer-approved`, derived from the working directory, where the upstream copy has the installing machine's absolute path; a path like that is wrong in every other checkout, and `__tests__/no-absolute-paths.test.ts` fails if one comes back).
- Commit trailer stays `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (the reviewer checks for a co-author line).
- The hooks cap AI commits at 5 files and 500 inserted lines (lock files excluded), so split work into small logical commits within a PR.
  Merge commits are exempt. Anything inherently larger is the owner's to commit with `USER_COMMIT=1`; ask rather than work around it.
- `docs/` is gitignored (local source material and the off-limits notes). Do not put anything that must be committed in it. Keep a backup of it
  outside the repo: it is the one place with material that exists nowhere else, and switching to a branch that tracked it would delete it.

## Commands (pnpm; Node per `.nvmrc`)

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (needs `.env`, see `.env.example`). Like `build`, `storybook` and `build-storybook`, it first runs `scripts/copy-maplibre-worker.mjs` (see the tour map bullet); `dev` and `storybook` also run `pnpm theme` first |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Required before presenting changes |
| `pnpm build` | Production build; works with placeholder `NEXT_PUBLIC_CSS_SITE_ID` and `CSS_API_KEY`. First copies MapLibre's worker files into gitignored `public/maplibre/` |
| `pnpm test:e2e` (alias `test:a11y`; `P1_LIVE=1` runs against live P1 content using the credentials in `.env`, default is repo-copy only) | Playwright: axe, keyboard, navigation and favicon checks against the standalone build (run `pnpm build` first; kill any stale server on :3100). Build and run with CI's placeholders and an unroutable base URL: `CSS_API_KEY=ci-placeholder CSS_API_KEY_LIVE= NEXT_PUBLIC_CSS_SITE_ID=00000000-0000-0000-0000-000000000000 NEXT_PUBLIC_CSS_BASE_URL=http://127.0.0.1:9 pnpm build`, then the same variables with `pnpm test:e2e` (see `test-pantheon.yml`). Never point a placeholder run at `ccr.p1.pantheon.io` (see "No P1 traffic from placeholders" under Architecture). A build that loads the real credentials from `.env` prerenders the published P1 pages, so the e2e run then tests those instead of the repo copies (seen on `/albums/ep`: album pages are prerendered at build and served until `revalidate = 300`) |
| `pnpm storybook` / `pnpm build-storybook` | Design system (`design-system/`, config in `.storybook/`); copies MapLibre's worker into `public/maplibre/` first |
| `pnpm theme` | Generate `design-system/theme.generated.css` from the palette in `band.config.json` (see "Palette" under the design approval workflow). `--check` (`tsx scripts/generate-theme.ts --check`) fails if the committed file is stale |
| `pnpm init-band <command>` | The helper the `/init-band` skill drives: `status` (is `setup.initialized` set), `suggest-palette --hue N [--loudness quiet\|balanced\|loud] [--scheme analogous\|complement\|triad\|mono]` (palette JSON on stdout, contrast report on stderr), `check-palette <file>` (exit 1 if the gate rejects it), `font-info <name> [--role display\|body\|wordmark\|kicker]` (looks the font up in Fontsource: how it ships, licence, specimen link, role notes; needs the network), `apply <answers.json> [--force] [--skip-assets]` (writes the config, local off-limits notes, docs, `package.json` name and description, `CODEOWNERS` owner, workflows and generated assets, and prints the secrets to set, each with where to get it; the answers' `type` is a font name per role, `display`, `body`, `wordmark`, `kicker`, which it looks up in Fontsource, so it needs the network when type changes (an optional `customFonts` list, `{ role, name }`, records custom typefaces still to add as a design PR after setup; it goes in the band's CLAUDE.md, not the config), then it syncs the `@fontsource` packages in `package.json`, runs `pnpm install` and checks the installed files unless `--skip-assets`, and `pnpm-lock.yaml` then needs committing). The answers file is the person's answers, so keep it under the gitignored `docs/`. It never receives a secret |
| `pnpm sync:registry` | Push Puck registry to P1 (needs `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY`; CI does it once the example workflow is installed) |

## Architecture decisions

- **`band.config.json`:** validated once by `lib/band/config.ts` (`parseBandConfig`, hand-written, no schema dependency; it lists every problem at once) and exported as
  `band`, `features`, `typography`, `editorial`. The palette in the same file is validated separately by `lib/theme/palette.ts`. `band` is the name, tagline, description,
  genre, `fictional` flag, canonical `siteUrl` (`NEXT_PUBLIC_SITE_URL` overrides it per environment), footer year and optional imprint line, and social links. Never hard-code
  a band name, genre or URL in a component; read it from here. `setup.initialized` records that `/init-band` has run; `hosting.pantheonSite` and `hosting.p1SiteId` record where the site lives (neither is a secret; keys and tokens never go in the file). Playwright specs cannot import the JSON module (its ESM loader rejects it): they read it through `e2e/helpers/config.ts`.
- **Features (`features.tour`, `merch`, `lyrics`, `map`, `press`).** An off section drops out of the header and footer, the sitemap and `llms.txt`, and its routes return 404
  (`tour` covers `/tour`, `/tickets/[id]`, `/ticket`, the home page's tour list and the hero's Tour dates button (the code version swaps its default buttons for Listen alone), the 404 page's Tour dates button, and the tour list and hero button in the `content/p1-pages/home.json` fixture, which `/init-band` rewrites so it still says what the code version says; `lyrics` also stops tracks linking to lyrics; `press` covers `/press` and the footer press-kit link;
  `map` hides `TourMap` on the tour and ticket pages and needs `tour`). `/press/kit` and any other P1-only page are the owner's to publish or not in P1; the `[...puckPath]` catch-all
  must stay an untouched shim, so it is not gated. The per-album and listen pages are always on.
- **Content split:** lyrics = Markdown in repo; bio, albums, tour dates, merch = P1 (with repo fallbacks); images = P1 media;
  audio = a Cloudflare R2 bucket served from the domain in `NEXT_PUBLIC_AUDIO_BASE_URL`, listed server-side at build/ISR
  from `<album-slug>/<NN>-<track-slug>.m4a`. Audio is never committed (`music/` is gitignored).
- **P1 pages (all of them except per-song lyrics, tickets and error pages, by decision):** `/`, `/tour`, `/bio`, `/merch`, `/listen`, `/albums`, `/albums/<slug>`, `/lyrics`, `/press`, `/privacy` render the published P1 page (`loadPublishedPage` via
  `lib/site/p1-content.ts`) and fall back to the repo copy when P1 is missing or unreachable, so CI (placeholder creds) and
  outages keep working. P1 pages use the band blocks in `components/puck/band/` (`PageHeadingBlock`, `ImageTextBlock`,
  `TourDatesBlock`, `MerchGridBlock`, plus `HeroBlock`, `ArticleBlock`, `AlbumHeaderBlock`, `TrackListBlock`, ... in `content-blocks.tsx` and
  `catalog-blocks.tsx`), offered in the editor under a category named after the band; ticket pages, sitemap and JSON-LD read shows from the `TourDatesBlock`. Catalog blocks get their data from
  `SiteDataProvider` (server-loaded on public pages via `P1Page`, fetched from `/api/site-data` in the editor canvas), so credentials never
  reach the browser. The starter's own "Welcome" document at `/` is ignored (`isStarterPage`). Page definitions live in
  `content/p1-pages/*.json`; CI renders them through a test-only `/e2e-fixtures/<name>` route (only when `E2E_FIXTURES=1`) and checks they
  say the same as the code versions, have one h1, pass axe and load every image (so a change to a code fallback needs the matching fixture change, and the reverse). Every design-system component must be mapped to a block or
  an exclusion reason in `__tests__/design-system-coverage.test.ts`. P1 has no
  templates/datasources here and the MCP cannot create them, so structured data lives in block array fields. Registry
  sync: `pnpm sync:registry` or the P1 MCP `sync_components` (CI does it on a site that has installed the example workflow); `fast-json-patch` is patched (`patches/`) because tsx
  otherwise loads its unshipped `index.ts`. Do NOT create P1 workstreams alongside code PRs (two histories, ordering bugs, merged-workstream reuse). Code merges and deploys first; pages are then created directly in P1 by the owner's instruction. Never publish or edit live P1 content unprompted.
- **How P1 content reaches live:** there is one P1 site and every Pantheon environment reads it; only the API key differs (drafts key off live, published-only
  key on live). So content does not move between environments: **publishing a page in P1 is the go-live step** (a page saved on `main` but not published is
  invisible to both keys; `publish_page` copies it live). Code moves dev -> test -> live through the Pantheon promotion workflow. To preview a content change
  without publishing, use a P1 workstream (that is what workstreams are for; the "no workstreams" rule above is only about pairing them with code PRs).
  Each `content/p1-pages/*.json` is both the design of a page and its fallback copy, so those files do not follow later edits made in P1.
- **Where the rest of the content lives:** the public pages are code under `app/(site)/` with content in the repo:
  `data/albums.json` (albums, tracks, an optional `gallery` of extra art per album, an `unreleased` pseudo-album with no `year`; exactly one album is `featured`, which sets the home hero and the "latest" badge and is otherwise an ordinary album at `/albums/<slug>`),
  `data/tour.json` and `data/merch.json` (fallbacks), `content/lyrics/*.md` (frontmatter `title`/`album`/`track`, `### Label` sections), `content/press/article.md`.
  To add a song: add it to `data/albums.json`, upload `<album>/<NN>-<slug>.m4a` to the bucket, add `content/lyrics/<slug>.md` if it has lyrics.
  P1 pages render inside the `(site)` layout (the catch-all lives under it). That layout supplies the header, footer and player, so a P1 page needs no header or footer block (an Article-only page like `/press` has both). The editor canvas has no layout, so `puckRoot.render` (`components/puck/root.tsx`) wraps the page in the real `SiteHeader` and `SiteFooter` there only (`puck.isEditing`), locked with `inert`, so pages can be built as they will look; on the public site the root adds nothing, so they never double up.
<!-- template:placeholders:start -->
- **Placeholders.** The seeded band, albums, shows, lyrics, merch and article are deliberately neutral. Images are solid-colour PNGs in the palette (`node scripts/make-placeholder-images.mjs`:
  cover, wide, merch, portrait); icons and the social card are drawn from the band name and palette, in the wordmark face (or the display face as typed) from its static Fontsource files, so `pnpm install` must have run (`node scripts/make-brand-assets.mjs`). Both read the generated theme, so run `pnpm theme` first
  after changing the palette. The seeded tour has one on-sale and one sold-out date so both ticket pages stay covered by tests; the ticket flow (`/tickets/[id]` -> `/ticket?...`) keeps all state in the URL and
  collects nothing. If the band is real, tour venues must be checked against a source before they are added; if it is fictional, say so in `band.fictional` and never present dates as real.
<!-- template:placeholders:end -->
- **Tour map (`TourMap` in the design system; MapLibre GL + OpenStreetMap raster tiles).** It starts as text (each venue and its
  address, no links out) and loads MapLibre and the tiles only when the visitor clicks "Show map", so by default nothing is requested and nothing
  about the visitor leaves the site. MapLibre 6 ships its web worker as two separate files that neither Turbopack nor Vite emits, so
  `scripts/copy-maplibre-worker.mjs` copies them into gitignored `public/maplibre/` before dev, build and Storybook, and the component loads that same-origin
  worker (`workerUrl`; Storybook passes a relative path like its images). Same-origin means the CSP needs no `blob:`. ESLint skips `public/maplibre/`. `maplibre-gl` is
  pinned exactly (check `package.json` for the version): do not adopt a release less than two weeks old. Pins come from each show's `lat`/`lon` (geocode the street address; the
  P1 `TourDatesBlock` carries them, `data/tour.json` is the fallback). It is placed on each show page (`/tickets/[id]`, that show's pin) and under the dates on `/tour` (in `TourDatesBlock` and the
  code fallback, every pin) when `features.map` is on; a show with no coordinates gets no map.
- **Songs and lyrics are independent resources.** A track with no lyrics, or lyrics with no audio, is normal (the seeded third track has no lyrics on purpose).
- **Persistent player** lives in the site layout; no cookies, no tracking, no mailing list. The `<audio>` element must
  NOT have `crossOrigin`: with it, every new preview/prod origin has to be added to the bucket's CORS list or playback
  silently fails (downloads still work because they go through `/api/download`). Without it playback needs no CORS.
- **Unreleased** means no public release (not "coming soon"). It is an album-style page with no `year`; do not seed it with
  songs that merely lack audio.
- Content editing guide for humans: `CONTENT.md`.
- **`serverExternalPackages: ["yjs"]`** in `next.config.ts` stops the "Yjs was already imported" warning (yjs loaded twice, ESM and CJS). The starter's `webpack` yjs alias is ignored by Turbopack, the default builder.
- **Single Next config:** `next.config.ts` only. The starter's `.mjs` config and the Pantheon template's `.ts`
  config coexisted and Next silently loaded the `.mjs`, dropping `output: "standalone"`. Merged; do not re-add.
  `cacheHandler.mjs` must stay plain JS: the standalone server loads it at runtime.
  `start` must be `node .next/standalone/server.js` (with `copy-standalone` in `build`), never `next start`: that
  ignores `output: standalone` and looks for `cacheHandler.mjs` inside `.next/`, so every request 500s on Pantheon.
- **`NEXT_PUBLIC_CSS_BASE_URL` is required** (`https://ccr.p1.pantheon.io`): the auth routes do not default it and 500 with "Server configuration error" if blank. (The data client does default; the broker does not.)
- **Secrets on Pantheon:** `terminus secret:site:set <site>[.env] NAME value --type=env --scope=web --rebuild`.
  Changes only apply after a rebuild. Values are write-only. P1 key: `CSS_API_KEY` (drafts scope) on dev/test/local;
  `CSS_API_KEY_LIVE` (published-only) on live. `getP1ApiKey()` (`lib/site/p1-key.ts`) picks the key by `PANTHEON_ENVIRONMENT` and throws on live without the live key; `instrumentation.ts` copies it into `CSS_API_KEY` at start because the SDK's published-page reads use that variable directly. Live with no `CSS_API_KEY_LIVE` returns 500 on purpose (verified), never the drafts key. Next loads `.env` itself, so test this with `CSS_API_KEY_LIVE=` (empty), not unset.
- **No P1 traffic from placeholders.** CI, the e2e run and local checks use placeholder credentials (a key containing "placeholder", an all-zeros or missing site id) so
  they render the repo copies. They must never send P1 a request: earlier they did, against the live backend, and every one was refused (measured with a local
  listener standing in for P1: 26 requests per build and about 2 per page load, so thousands per e2e run). `isP1Configured()` in `lib/site/p1-config.ts` is false for
  those credentials; `getP1Page` then returns null without calling the SDK, and `next.config.ts` sets the build-time `NEXT_PUBLIC_CSS_BASE_URL` to the unroutable
  `http://127.0.0.1:9`, which also stops the SDK's own catch-all route (that route must stay an untouched shim; `published-page-routes.test.ts` pins it). CI's build and
  e2e steps use the same unroutable URL. After the change a build, the whole e2e run and 14 page loads sent the listener 0 requests. In placeholder mode an unknown path
  returns a 500 (the SDK's fetch to the unroutable address fails) where P1's 400 used to be handled; nothing tests it. The key is judged by `getP1ApiKey()`, so on live it is
  `CSS_API_KEY_LIVE`; the check runs at build time, and on Pantheon the live key is a secret that only applies after a rebuild, so build and runtime agree. To check for stray
  requests, point `NEXT_PUBLIC_CSS_BASE_URL` at a local HTTP listener and count what it receives.

## Accessibility

Target is WCAG 2.2 AA. Three layers: `eslint-plugin-jsx-a11y` (recommended rules) on `design-system/`,
`components/site/` and `app/(site)/`; the Storybook a11y addon (`test: "error"`); and `e2e/a11y.spec.ts`, which runs axe
(wcag2a/2aa/21a/21aa/22aa + best-practice) on every public route at desktop and mobile sizes plus keyboard, skip-link,
focus-ring and reduced-motion checks. When adding a route, add it to the `routes` list there. The e2e specs are feature-aware: they list every route but wrap those that belong to a switchable section in `when("<feature>", ...)` (or check `features.<feature>`) from `e2e/helpers/config.ts`, which reads `band.config.json`, so a band with sections off still passes; wrap a new route the same way. The 404 page goes through P1, so it is only checked with
`A11Y_P1_ROUTES=1` and real credentials in `.env`. Each page needs exactly one
h1; cards take `headingLevel="h2"` when they sit directly under it. Seeking uses a real `<input type="range">`.
Not covered by automation: screen-reader pass, captions (songs rely on linked lyrics as the text alternative), and the
player in its "has audio" state (CI has no bucket credentials).

## Standards

Follows https://specification.website where it applies: canonical + Open Graph via `pageMetadata`, JSON-LD, robots/sitemap/manifest,
security headers + CSP in `next.config.ts` (production only; `/p1` exempt), privacy page, custom 404/500, optimised images. Deliberately not done (template defaults,
change them on purpose): AI-crawler rules in robots.txt and Content-Signal, hreflang (one language, so there is no per-language `lang` handling for titles either),
cookie consent and GPC (no cookies or data processing), RSS (no feed content). standard.site support is verification plumbing
driven by `data/standard-site.json`; the records themselves are created by `scripts/publish-standard-site.mjs` (reads `band.config.json`) with the owner's
account, which Claude must not run without being given credentials. `security.txt` needs `SECURITY_CONTACT`.

**Privacy.** Any change that adds a third-party request or stores anything about a visitor must update the Privacy page in the same changeset: the repo copy
(`content/p1-pages/privacy.json`), the page's code fallback, and the published P1 `/privacy` page (a live edit, so it needs the owner's go-ahead). The tour map is the
first such case: the CSP in `next.config.ts` allows `connect-src https://tile.openstreetmap.org` (`img-src` already allows `https:`, and the worker is same-origin so
`script-src 'self'` covers it), and the Privacy page has a "The map" section saying it contacts OpenStreetMap, which sees the visitor's IP address, and only after they click
Show map. A published P1 `/privacy` page is a separate copy, so any later change to this text has to be made in P1 as well.

## CI / deployment

- `test-pantheon.yml`: lint, typecheck, unit, build, accessibility (Playwright + axe), all on the runner with placeholder credentials. Nothing here needs a Pantheon environment or secrets; the deployed-site check is its own workflow (below). Storybook is built only by `storybook-preview.yml` (every PR), not here.
- `promote-pantheon.yml`: push to `test` or `live` branch tags `pantheon_test_N` / `pantheon_live_N`.
<!-- template:workflow-sync:start -->
- `examples/workflows/sync-puck-registry.yml`: inactive example (GitHub only runs `.github/workflows/`) of the headless registry sync. The template has no P1 site, so it would fail every push touching `components/puck/**`. A site built from the template installs it once it has its own P1 site and secrets `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` (per site, never another site's); the `/init-band` skill is meant to do this. Skipped for Dependabot pushes (its runs see only Dependabot secrets, and it never edits the registry). Until installed, sync with `pnpm sync:registry` locally or the P1 MCP `sync_components`.
<!-- template:workflow-sync:end -->
- `storybook-preview.yml`: per-PR preview at `https://<owner>.github.io/<repo>/pr-N/` (gh-pages; needs
  Pages enabled, which needs a public repo or paid plan).
- Repo secrets: `PANTHEON_MACHINE_TOKEN` (also as a Dependabot secret; a Pantheon personal access token, which expires 90 days after it is created, so replace both copies before then: SETUP.md step 0a) for `promote-pantheon.yml` and the deployed-site check, plus the three registry-sync secrets when that workflow is installed. The always-on CI checks run on placeholders and need none.
- `dependabot.yml`: weekly (Monday) npm and GitHub Actions updates, minor and patch grouped, a 14-day cooldown (the "no release under two weeks old" rule; it applies to version updates only, security updates bypass it). TypeScript 7 and ESLint 10 are ignored, with the blockers copied from a sister site on the same stack: not re-tested here, so lift an entry by trying the update on a PR environment. A `versions:` ignore also hides security-update PRs for that range, so keep Dependabot alerts enabled (a repo setting, not in this file). Dependabot PRs are ordinary PRs into `main`: squash-merge them. `@pantheon-systems/nextjs-cache-handler` is deliberately not ignored (owner's call). A sister site keeps live on 0.9.0 after 0.11.0 took its live site down on a large cache, whereas `cacheHandler.mjs` here has an unbounded initialise, so revisit if live shows restarts.
<!-- template:workflow-deploy:start -->
- `examples/workflows/test-deployed-site.yml`: an inactive example (GitHub only runs `.github/workflows/`) of the check the template dropped: wait for Pantheon to build `pr-N`/`dev`, then expect 200. A site built from the template installs it once the Pantheon site and `PANTHEON_MACHINE_TOKEN` (Actions and Dependabot secrets) exist; the `/init-band` skill is meant to do this. Its header lists the steps. Add it as a required check only after it passes.
<!-- template:workflow-deploy:end -->

## Palette

`band.config.json` is the source of truth for colour: 13 roles (`void`, `surface`, `raised`, `line`, `text`, `muted`, `dim`, `accent`, `accent-2`, `accent-3`,
`metal-hi`, `metal-mid`, `metal-lo`) as `#rrggbb`. `pnpm theme` writes `design-system/theme.generated.css` (the `@theme` colour tokens, the glow shadows and the
`--grad-accent`/`--grad-metal` gradients), which `ds.css` imports. Never edit the generated file; edit the config and regenerate. A reference palette (`__tests__/fixtures/reference-palette.json`) is the generator's regression fixture and must come out unchanged, whatever palette the band chooses.

- **Accessibility gate (`lib/theme/palette.ts`).** Every text colour must reach WCAG AA (4.5:1) on all three surfaces, and `void` text on the fills that carry it (`accent`, `accent-3`,
  `metal-hi`). `dim` is held to 4.5:1 too, stricter than the 3:1 a secondary-text token could claim. A failing colour is lifted in OKLCH lightness (same hue, `lib/theme/contrast.ts`) and
  reported on stderr; an unrepairable palette (for example a light surface, since the system is dark-only) is rejected with the reason and nothing is written. The generator never emits a failing
  palette. Note the generated file holds the adjusted values while the config keeps what the author wrote.
- **Storybook.** Foundations > Color and type renders the active palette (swatches with ratios), a table of every gated pair, and a deliberately failing example showing what the lift does. They read
  `band.config.json` through the same generator code, so they cannot drift from the real tokens.
- **Staleness.** `__tests__/theme-palette.test.ts` fails if `theme.generated.css` is not what the config produces. `build` does not run the generator (production builds should not need `tsx`);
  `dev` and `storybook` do.
- **Roles only.** Components use `accent`, `accent-2`, `accent-3` and `metal`, never a hue; `__tests__/colour-token-roles.test.ts` fails if a hue-named token returns or an original-palette literal
  appears outside its justified allowlist.

## Design approval workflow

Design work goes on `design-<topic>` branches into a protected `design` branch. Merging the PR is the approval.
Only approved tokens/components are applied to the site via a PR from `design` to `main`. Dark theme only; the palette comes from
`band.config.json` (see "Palette").

The flow, and why each step is the way it is:
1. **Cut the branch from a freshly pulled `main`, never from `design`.** `design` can lag behind `main`; a branch cut from it carries that lag, and the later apply merge then has to reconcile two diverged histories (it once reverted newer text in `CLAUDE.md` and the coverage test).
2. **Open the PR into `design`** with the Storybook preview link. The owner's merge of that PR is the design approval. Merge it with a **merge commit**, so `design` picks up `main`'s history along with the change.
3. **Apply it:** pull `main`, cut a branch from it, merge `origin/design` into it, and open a PR into `main`. Merge it with a **merge commit**, so `design` becomes an ancestor of `main` and the next design PR does not conflict. If the merge conflicts, resolve it deliberately and then check the whole tree: `git diff origin/main` must list only the intended files, and `git diff origin/design -- design-system .storybook` must be empty. Never rely on `-X theirs` alone; it silently takes `design`'s older text.
4. **Wire it up** (the site code that uses the new component or prop) in a separate PR into `main` once the apply has merged.

**Merge method, stated on every PR.** The repo default is squash, and the owner squashes unless told otherwise. So the first line of every PR body Claude opens is `**Merge method: MERGE COMMIT**` or `**Merge method: SQUASH**`, and the message that hands over the link says the same.

| PR | Merge method |
|---|---|
| `design-<topic>` into `design` | Merge commit |
| `design` into `main` (apply) | Merge commit |
| Anything else into `main` (code, content, docs, CI, wiring) | Squash |

Squashing either design-flow leg is what produced repeated conflicts on the apply merge (#44 to #45, #47 to #48).

Type: `band.config.json` `typography` names a face for each role: `display` (headings, buttons, labels: tight, extra-bold), `body`, and optionally `wordmark` (the band
name only, in flat colour, tight, capitals if `uppercase`) and `kicker` (the small labels above headings and flourishes, never the name). The template's are Encode Sans Expanded
and Space Grotesk, with the other two off. When `wordmark` or `kicker` is off, that role uses the display face, so components never name a face: they use `font-display`,
`font-body`, `font-wordmark` and `font-kicker`, and `__tests__/colour-token-roles.test.ts` fails on a face named by its style (the blackletter-named utility this replaced).

- **Where the faces come from.** Each is a Fontsource package (`@fontsource/<id>`, or `@fontsource-variable/<id>` when the family has a weight axis), self-hosted. That is what keeps the CSP at
  `font-src 'self'` and the site free of third-party requests (a font CDN would tell it which visitor loaded which page). `pnpm theme` writes the stacks into `theme.generated.css` and the imports
  into `design-system/fonts.ts`; never edit either by hand. A static face ships the available weight nearest each one the components use (600/700/800 for `display`, 400 to 700 for `body`), so a
  single-weight display font is fine (`font-synthesis-weight: none` on the display roles stops a faked bold). `typography` records Fontsource's facts about each face (id, family, category,
  variable, weights) so nothing needs the network after setup; `pnpm init-band font-info <name>` looks one up.
- **Custom fonts (licensed files, a foundry, anything not in Fontsource) are a design PR after setup**, not a setup option: the font files and a licence come from the owner, and a new face
  changes the design system, so it goes through the design approval workflow above (`design-fonts-<name>` from a freshly pulled `main`, Storybook at the relevant sizes). Until then the config
  names the nearest Fontsource face as a stand-in, `/init-band` lists the face under "Custom typefaces still to add" in the band's CLAUDE.md (the `customFonts` answers) and offers this PR once the setup is merged. The PR adds a face kind for local files to `lib/theme/fonts.ts` (files under `design-system/fonts/`, imported from the generated `fonts.ts`),
  keeps them same-origin, and checks that the licence allows web embedding.
