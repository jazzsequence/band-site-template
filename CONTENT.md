# Editing site content

## In P1 (no code change needed)

Sign in at `/p1` and edit these pages in the visual editor. Changes go live when published.

| Page | What you edit | Blocks |
|---|---|---|
| `/` | The hero, the tour preview, the albums section | Hero, Tour preview, Section heading, Album grid |
| `/tour` | Tour dates. Add, change or remove shows; each gets a ticket page automatically | Page heading, Tour dates |
| `/listen` | The intro. The albums and their songs come from the catalog | Page heading, Album with tracks |
| `/albums`, `/albums/<album>`, `/well-enough` | Headings and text around each album. Cover, year and songs come from the catalog | Album header, Track list, Album grid, Image gallery |
| `/lyrics` | The intro. The list comes from the lyrics files | Page heading, Lyrics index |
| `/press`, `/privacy` | The text, in Markdown | Article |
| `/bio` | Bio text and photo | Image and text |
| `/merch` | Merch items, prices and images | Page heading, Merch grid |

**Catalog blocks** (Album grid, Album header, Track list, Album with tracks, Lyrics index, Tour preview) show data that lives
elsewhere: pick the album from the list and the title, cover, year and songs follow `data/albums.json`, the audio bucket
and the lyrics files. Add a song there (see "Adding a song" below) and it appears everywhere.

**Not in P1:** the per-song lyrics pages (`/lyrics/<song>`, one code route reading the Markdown files), the ticket
checkout and e-ticket, and the error pages.

`content/p1-pages/*.json` holds each page above exactly as it was designed. They are tested against the code versions in CI,
and are the copy to rebuild a page from if one is ever damaged.

Notes:
- **Tour dates:** each show has an optional **URL id**. Set it once and never change it, because ticket links use it. If left empty it is made from the city and date.
- **Always one h1:** every page needs exactly one. Use a Page heading block, or set an Image and text block's title to h1.
- **Fallback:** if P1 is unreachable, or a page is not published, every page above falls back to the code version in this repo (`data/tour.json`, `data/merch.json` and the page files under `app/(site)/`). Keep those roughly current.
- **Workstreams:** work on a P1 workstream and merge to main to publish.

## In this repo

Everything below is a file. Edit, commit, and open a PR.

| What | Where | Notes |
|---|---|---|
| Tour dates (fallback) | `data/tour.json` | One object per show: `id` (used in the ticket URL), `date` (YYYY-MM-DD), `city`, `venue`, `address`, optional `capacity`, `doors`, `price`, `status` (`on-sale` or `sold-out`), `lat`, `lon`. Sorted by date automatically. |
| Albums and track lists | `data/albums.json` | Each track needs `number`, `slug` and `title`. An album with no `year` is treated as unreleased and is labelled that way. An album with an empty `tracks` list shows a "nothing here yet" message. |
| Audio | Cloudflare R2 bucket | Upload `<album-slug>/<NN>-<track-slug>.m4a`. The site lists the bucket every 5 minutes, so a new file appears without a deploy. A track with no file shows "Audio unavailable". |
| Lyrics | `content/lyrics/<slug>.md` | Frontmatter: `title`, and optionally `album` (an album slug) and `track`. Each `### Label` line starts a section. A song with no `album` is listed under "More songs". |
| Press interview | `content/press/interview.md` | Plain Markdown. |
| Merch (fallback) | `data/merch.json` | `name`, `price`, `image`. |
| Bio (fallback) | `app/(site)/bio/page.tsx` | Used only when the P1 page is unavailable. |
| Images | `public/images/` | Reference as `/images/<file>`. |

## Adding a song

1. Add it to the album's `tracks` in `data/albums.json` (or create the album).
2. Upload the audio file using the naming above.
3. Add `content/lyrics/<slug>.md` if it has lyrics. The track slug and lyric slug must match.

Songs and lyrics are independent: lyrics with no audio, or audio with no lyrics, both work.

## Images

Keep images small: JPEG, at most 1600 px wide, ideally under 300 KB. The originals are large; resize before adding.
Social and icon images are generated: `node scripts/make-brand-assets.mjs` rebuilds the icons, web manifest icons and
the 1200x630 social card (`public/og-default.jpg`) from the wordmark font and the stage photo.

## Standards and discovery

| What | Where | Notes |
|---|---|---|
| Page titles, descriptions, canonical URLs, Open Graph | `lib/site/seo.ts` (`pageMetadata`) | Every page calls it; do not hand-write metadata |
| Structured data (artist, albums, events, breadcrumbs) | `lib/site/structured-data.ts` | Albums and events are built from `data/albums.json` and `data/tour.json` |
| `robots.txt`, `sitemap.xml`, `llms.txt`, manifest | `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt`, `app/manifest.ts` | Non-live Pantheon environments are blocked from indexing |
| Security headers and CSP | `next.config.ts` | `/p1` is exempt on purpose |
| `/.well-known/security.txt` | `app/.well-known/security.txt` | Set `SECURITY_CONTACT` (a `mailto:` or `https:` URL) as a Pantheon secret; 404 until it exists |
| standard.site | `data/standard-site.json` | Run `scripts/publish-standard-site.mjs` with a Bluesky handle and an **app password**, commit the file it writes |
