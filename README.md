# Band site template

A website for a band, real or fictional, that you can have running end to end without writing code: tour dates and
tickets, music with a persistent player, lyrics, albums, press, bio and merch. Built with Next.js 16, edited in
[P1](https://content.pantheon.io) with Puck, and hosted on Pantheon. Dark theme only,
WCAG 2.2 AA, no cookies, no analytics.

Everything about the band lives in one file, `band.config.json`: its name, which sections exist, its type choices and its
colour palette. A script turns the palette into the theme and refuses any text colour that would fail contrast.

## Start a site

1. **Create a repository from this template** ("Use this template" on GitHub, or
   `gh repo create my-band --template jazzsequence/band-site-template --public`), clone it, and run `pnpm install`.
2. **Open it in [Claude Code](https://claude.com/claude-code) and run `/init-band`.** It asks about the band in batches
   (identity, look, type, sections, hosting), proposes palettes with their contrast ratios, writes the config, theme,
   placeholder images, icons and social card, installs the CI workflows, and rewrites `CLAUDE.md` and this README for the
   band. It never asks you to paste a secret: it gives you commands that read each key from a hidden prompt.
3. **Follow [SETUP.md](SETUP.md)** for the Pantheon site, the P1 site and keys, the audio bucket, and the GitHub settings the
   workflows need.
4. **Replace the sample content** (albums, shows, merch, lyrics, press, bio) using [CONTENT.md](CONTENT.md), and publish
   your pages in P1.

Without Claude Code you can do step 2 by hand: edit `band.config.json` (set `setup.initialized` to `true`), run
`pnpm theme`, and see `.claude/skills/init-band/SKILL.md` for everything the skill would have done.

The template ships a clearly fake band, "Your Band", with sample albums, two shows and placeholder images so every page and
test has something to render.

## What you get

| Route | What it is |
|---|---|
| `/` | Home: latest release, next tour dates, albums |
| `/tour`, `/tickets/[id]`, `/ticket` | Tour dates, a demonstration checkout, and an e-ticket with a QR code. Nothing is stored; ticket details live in the URL |
| `/listen`, `/albums`, `/albums/[slug]` | Streaming and downloads, and one page per album |
| `/lyrics`, `/lyrics/[slug]` | Every lyric |
| `/press`, `/bio`, `/merch`, `/privacy` | Press article, bio, merchandise, privacy policy |
| `/p1` | The page editor (sign-in required) |

The tour, merch, lyrics, press and the tour map can each be switched off in `band.config.json`; a switched-off section drops out of
the navigation, sitemap and `llms.txt`, and its routes return 404. The wordmark face and the blackletter accent for kickers are
optional too. Audio keeps playing while you move around the site.

## Commands

Requires Node per `.nvmrc` and pnpm.

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server (copy `.env.example` to `.env` first; it regenerates the theme) |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Lint, types and unit tests |
| `pnpm build` | Production build (standalone output, as Pantheon runs it) |
| `pnpm test:e2e` | Playwright accessibility, keyboard and navigation checks against the build. Build first and make sure nothing is listening on port 3100. First time: `pnpm exec playwright install chromium` |
| `pnpm theme` | Regenerate `design-system/theme.generated.css` from the palette in `band.config.json`; a palette whose text colours cannot reach WCAG AA is repaired (same hue) or rejected |
| `pnpm init-band <command>` | The helper behind `/init-band`: `status`, `suggest-palette`, `check-palette`, `apply` |
| `pnpm storybook`, `pnpm build-storybook` | The design system |
| `pnpm sync:registry` | Push the Puck component registry to P1 (needs the registry secrets) |

## How it is put together

- **The band:** `band.config.json`, validated by `lib/band/config.ts`. Components read it and never hard-code a name or colour.
- **Colour:** thirteen roles in the config; `lib/theme/` generates the theme and enforces 4.5:1 contrast. Components use roles
  (`accent`, `accent-2`, `accent-3`, `metal`), never hues, and a test fails if a hue-named token comes back.
- **Content:** albums, tour, merch and lyrics are files in `data/` and `content/`; pages are edited in P1 and fall back to the repo
  copy if P1 is unreachable. Audio is in a Cloudflare R2 bucket, never in git.
- **Design changes** go on a `design-<topic>` branch into a protected `design` branch, and the owner merging that pull request is the
  approval. Every pull request gets a Storybook preview.
- **Commits** go through a reviewer agent and a pre-commit hook (tests, lint, types, build). `CLAUDE.md` records the architecture
  and the reasons behind it.

## CI that needs no secrets

The checks that run on every pull request need no secrets and no Pantheon site: lint, types, unit tests, a production build with
placeholder credentials, and the end-to-end accessibility suite. Two more workflows are inactive examples in `examples/workflows/`
(a deployed-site check and the headless registry sync) because they need a site that exists; `/init-band` installs them once it
has the facts.

## Layout

```
app/(site)/          public pages and their shared layout (header, footer, player)
app/p1/              the P1 editor and its API and auth routes
band.config.json     the band: identity, sections, type, palette, hosting
components/site/     site-specific client components (player, ticket form, breadcrumbs)
components/puck/     P1 blocks (band blocks in components/puck/band/)
design-system/       tokens, components, stories
lib/band/  lib/theme/  lib/init/   config, theme generator, the /init-band engine
lib/site/            catalogue, lyrics, tour, audio listing, SEO helpers
data/  content/      albums, tour, merch, lyrics, press (see CONTENT.md)
e2e/                 Playwright tests
scripts/             theme, placeholder-image, icon and init generators; registry sync
examples/workflows/  CI workflows a site installs once it has a Pantheon and P1 site
.claude/skills/      the /init-band skill
```

## Licence

MIT. See [LICENSE](LICENSE).
