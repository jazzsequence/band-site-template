# Band site template

A website for a band, real or fictional: tour dates and tickets, music with a persistent player, lyrics, the latest album, press and bio.
Built with Next.js 16, edited with [P1](https://content.pantheon.io) and Puck, and hosted on Pantheon.

It ships with a placeholder band ("Your Band"). Everything band-specific is in `band.config.json` (name, tagline, which sections exist,
type choices, palette) and in `data/` and `content/`; see [CONTENT.md](CONTENT.md).

## What's here

| Route | What it is |
|---|---|
| `/` | Home: latest release, next tour dates, albums |
| `/tour`, `/tickets/[id]`, `/ticket` | Tour dates, a demonstration checkout, and an e-ticket with a QR code. Nothing is stored; ticket details live in the URL |
| `/listen`, `/albums`, `/albums/[slug]` | Streaming and downloads, and one page per album |
| `/lyrics`, `/lyrics/[slug]` | Every lyric |
| `/press`, `/bio`, `/merch`, `/privacy` | Press article, bio, merchandise, privacy policy |
| `/p1` | The page editor (sign-in required) |

Audio keeps playing while you move around the site. There are no cookies, no analytics and no sign-ups.

## Quick start

Requires Node per `.nvmrc` and pnpm.

```bash
pnpm install
cp .env.example .env   # then fill in the values below
pnpm dev               # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CSS_SITE_ID` | The P1 site ID |
| `CSS_API_KEY` | A P1 API token for this site |
| `NEXT_PUBLIC_CSS_BASE_URL` | P1 backend, `https://ccr.p1.pantheon.io`. Required: the P1 sign-in routes return 500 without it |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Read-only access to the audio bucket, used on the server to list tracks |
| `NEXT_PUBLIC_AUDIO_BASE_URL` | Public base URL of the audio bucket |

The site builds and runs without the audio variables; tracks then show as unavailable.
Never commit `.env`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server (regenerates the theme from `band.config.json` first) |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Lint, types and unit tests |
| `pnpm build` | Production build (standalone output, as Pantheon runs it) |
| `pnpm test:e2e` | Playwright accessibility, keyboard and navigation checks against the build. Run `pnpm build` first and make sure nothing is listening on port 3100. First time: `pnpm exec playwright install chromium` |
| `pnpm storybook` | Design system on port 6006 |
| `pnpm build-storybook` | Static Storybook build |
| `pnpm theme` | Regenerate `design-system/theme.generated.css` from the palette in `band.config.json`; fails the palette if a text colour cannot reach WCAG AA |
| `pnpm sync:registry` | Push the Puck component registry to P1 (needs the registry secrets; see `examples/workflows/`) |

## Content

Tour dates, albums, tracks, lyrics, merch and the press article are files in this repo.
See [CONTENT.md](CONTENT.md) for what to edit and how to add a song.

Audio is stored in a Cloudflare R2 bucket, never in git. Upload `<album-slug>/<NN>-<track-slug>.m4a`
and the site picks it up within five minutes.

## Design system

Components live in `design-system/` with a story each, and are documented in Storybook. The site is dark only.
Design changes are proposed on a `design-<topic>` branch and approved by merging a pull request into the
protected `design` branch; only then are they applied to the site. Every pull request gets a Storybook preview
at `https://<owner>.github.io/<repo>/pr-N/`.

## Accessibility

The target is WCAG 2.2 AA. It's enforced by `eslint-plugin-jsx-a11y`, the Storybook accessibility addon, and an
end-to-end suite that runs axe on every public page at desktop and mobile sizes, plus keyboard, focus and
reduced-motion checks. CI fails the pull request if any of them fail.

## Deployment

Hosted on Pantheon (set the site name in `.github/workflows/promote-pantheon.yml`) with `dev`, `test` and `live` environments, plus a `pr-N` environment for
each open pull request. Pushing to `main` updates `dev`. Pushing to the `test` or `live` branch promotes
that environment and tags the release. Secrets are set with Terminus:

```bash
terminus secret:site:set <site>.dev NAME value --type=env --scope=web --rebuild
```

Secret values only take effect after a rebuild and cannot be read back.

GitHub repository secrets, for a site made from the template: `PANTHEON_MACHINE_TOKEN` (also needed as a Dependabot secret) for promotions, and
`CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` for the registry sync once you install it from `examples/workflows/`. The template itself needs none.

## Layout

```
app/(site)/          public pages and their shared layout (header, footer, player)
app/p1/              the P1 editor and its API and auth routes
components/site/     site-specific client components (player, ticket form, breadcrumbs)
design-system/       tokens, components, stories
lib/site/            catalogue, lyrics, tour, audio listing, SEO helpers
band.config.json     the band: identity, sections, type, palette
lib/band/            validates band.config.json; lib/theme/ generates the theme
data/  content/      albums, tour, merch, lyrics, press (see CONTENT.md)
e2e/                 Playwright tests
scripts/             theme generator, placeholder-image and icon generators, registry sync
```

## Further reading

`CLAUDE.md` records architecture decisions and the reasons behind them.
