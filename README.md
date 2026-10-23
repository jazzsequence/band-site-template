# PARIS

The website for PARIS: tour dates and tickets, music with a persistent player, lyrics, the latest album, press and bio.

Live at [paris.jazzsequence.com](https://paris.jazzsequence.com). Built with Next.js 16, edited with
[P1](https://content.pantheon.io) and Puck, and hosted on Pantheon.

## What's here

| Route | What it is |
|---|---|
| `/` | Home: latest release, next tour dates, albums |
| `/tour`, `/tickets/[id]`, `/ticket` | Tour dates, a demonstration checkout, and an e-ticket with a QR code. Nothing is stored; ticket details live in the URL |
| `/listen`, `/albums`, `/albums/[slug]`, `/well-enough` | Streaming and downloads, one page per album, and a page for the latest release |
| `/lyrics`, `/lyrics/[slug]` | Every lyric |
| `/press`, `/bio`, `/merch`, `/privacy` | Interview, bio, merchandise, privacy policy |
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
| `pnpm dev` | Development server |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Lint, types and unit tests |
| `pnpm build` | Production build (standalone output, as Pantheon runs it) |
| `pnpm test:e2e` | Playwright accessibility, keyboard and navigation checks against the build. Run `pnpm build` first and make sure nothing is listening on port 3100. First time: `pnpm exec playwright install chromium` |
| `pnpm storybook` | Design system on port 6006 |
| `pnpm build-storybook` | Static Storybook build |
| `pnpm sync:registry` | Push the Puck component registry to P1 (CI does this) |

## Content

Tour dates, albums, tracks, lyrics, merch and the press interview are files in this repo.
See [CONTENT.md](CONTENT.md) for what to edit and how to add a song.

Audio is stored in a Cloudflare R2 bucket, never in git. Upload `<album-slug>/<NN>-<track-slug>.m4a`
and the site picks it up within five minutes.

## Design system

Components live in `design-system/` with a story each, and are documented in Storybook. The site is dark only.
Design changes are proposed on a `design-<topic>` branch and approved by merging a pull request into the
protected `design` branch; only then are they applied to the site. Every pull request gets a Storybook preview
at `https://jazzsequence.github.io/paris-site/pr-N/`.

## Accessibility

The target is WCAG 2.2 AA. It's enforced by `eslint-plugin-jsx-a11y`, the Storybook accessibility addon, and an
end-to-end suite that runs axe on every public page at desktop and mobile sizes, plus keyboard, focus and
reduced-motion checks. CI fails the pull request if any of them fail.

## Deployment

Hosted on Pantheon as `paris-site` with `dev`, `test` and `live` environments, plus a `pr-N` environment for
each open pull request. Pushing to `main` updates `dev`. Pushing to the `test` or `live` branch promotes
that environment and tags the release. Secrets are set with Terminus:

```bash
terminus secret:site:set paris-site.dev NAME value --type=env --scope=web --rebuild
```

Secret values only take effect after a rebuild and cannot be read back.

GitHub repository secrets used by CI: `PANTHEON_MACHINE_TOKEN` (also needed as a Dependabot secret),
and `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` for the registry sync.

## Layout

```
app/(site)/          public pages and their shared layout (header, footer, player)
app/p1/              the P1 editor and its API and auth routes
components/site/     site-specific client components (player, ticket form, breadcrumbs)
design-system/       tokens, components, stories
lib/site/            catalogue, lyrics, tour, audio listing, SEO helpers
data/  content/      albums, tour, merch, lyrics, press (see CONTENT.md)
e2e/                 Playwright tests
scripts/             icon and social-card generator, registry sync
```

## Further reading

`CLAUDE.md` records architecture decisions and the reasons behind them.
