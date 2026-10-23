---
name: init-band
description: Set up a repo made from the band site template for a specific band, real or fictional. Use when band.config.json has setup.initialized false (the repo is still the placeholder band "Your Band"), or when asked to initialise, set up or re-theme a band site. Asks about the band in batches, proposes palettes with real contrast ratios, writes the config, theme, images, icons, local off-limits notes and workflows, lists the secrets to set (never collecting them), runs every check, and rewrites CLAUDE.md for the band.
---

# Set up a band site from the template

Run this first in a fresh copy of the template. It turns the placeholder band into a specific one without leaving the template's own history in the repo.

Work through the steps in order. Present command output to the person yourself: they cannot see it unless you show it. Ask before anything destructive or outward-facing, and never publish or edit live P1 content.

The helper does the deterministic work: `pnpm exec tsx scripts/init-band.ts <command>` (`status`, `suggest-palette`, `check-palette`, `apply`). You do the asking, the choosing of palette hues and the checking. The answers are validated by the same parser the site uses at build time, so a setup that applies cannot fail the first build.

## Rules that never bend

- **Secrets never pass through the chat.** Do not ask for, accept or repeat a key or token. Step 6 hands over commands that read each value from a hidden prompt in the person's own terminal. If someone pastes a secret anyway, do not repeat it, tell them to rotate it, and carry on.
- **The off-limits list stays local.** Topics go only into `docs/off-limits.md` (gitignored). Never echo them back, never put them in a commit message, a PR, a file under version control, or this skill's output; say only how many there are.
- **Do not edit around the placeholder.** If `setup.initialized` is false, finish this flow before changing anything else.
- **Do not create a Pantheon site, a P1 site or any GitHub repo without an explicit yes** to the exact command.
- Never use `USER_COMMIT=1` yourself. The setup touches too many files for an AI commit; the owner commits it (step 8).

## Step 0: check where you are

1. `pnpm exec tsx scripts/init-band.ts status`. If `initialized` is true, stop: the band is already set up. Re-running overwrites `band.config.json`, so only continue if the person asks to start over, and then pass `--force` to `apply`.
2. `gh repo view --json isTemplate,nameWithOwner`. If `isTemplate` is true this is the template repository itself: stop and tell the person to create a repository from the template first ("Use this template" on GitHub, or `gh repo create <name> --template <owner>/band-site-template --public`), then run this in that copy. If the command fails (no remote, not signed in), stop and ask what repository this is and whether it was made from the template; do not guess.
3. `git status --short` should be clean apart from files they expect. If not, say what is dirty and ask whether to go on.
4. `apply` regenerates the icons and social card with a headless browser, so dependencies must be installed (`pnpm install`) and Chromium available (`pnpm exec playwright install chromium`). Check `gh auth status` and `terminus auth:whoami` only as each step needs them.

## Step 1: identity (first batch)

Ask these in one message, plainly, as free text:

- **Name** of the band or act.
- **Real or fictional?** If fictional, pages never present it as real (tour dates, releases).
- **Genre**, and one line on what it sounds like (becomes the tagline), plus two sentences for the description used by search results and social cards. Offer to draft them from what they say.
- **Site URL** (the production domain, https).
- **Anything else for the footer**: a label or distributor line, and social links (label and URL each).
- **Off-limits topics**: "Is there anything the site's copy, alt text and comments must never mention or hint at? I will keep the list only in a local gitignored file and never repeat it." It is fine to have none.

Validate as you go: tagline up to 140 characters, description up to 300, name up to 60. A tagline or description you draft is public copy: check it against the local off-limits list (`docs/off-limits.md`, once written; until then against what they told you) and never mention that list in the draft.

## Step 2: look (second batch)

Ask for **mood words or reference acts**, and **how loud the palette should be**: quiet (muted accents), balanced, or loud (hot, saturated accents).

Choose three different directions from what they said. Each is a hue (degrees on the colour wheel), a loudness, and a scheme for how the three accents spread:

| Hue | Reads as | Hue | Reads as |
|---|---|---|---|
| 10 to 30 | red, coral, warm | 200 to 230 | cyan, ice, cool |
| 40 to 70 | orange, amber, gold | 240 to 270 | blue, indigo, night |
| 80 to 120 | lime, acid, olive | 280 to 320 | violet, purple, plum |
| 130 to 170 | green, mint, forest | 330 to 355 | magenta, pink, rose |

Schemes: `analogous` (neighbours, calm), `complement` (opposite, tense), `triad` (evenly spread, playful), `mono` (one family, restrained). Surfaces are always dark; this design system is dark-only.

For each direction run `pnpm exec tsx scripts/init-band.ts suggest-palette --hue N --loudness L --scheme S`. The JSON goes to stdout and the contrast report to stderr. **Show the person each report** (colours, ratios, and what the gate adjusted), describe the feel in a sentence, and let them pick one, ask for a tweak (a different hue, louder, quieter), or paste hex values of their own. To check a hand-made palette, save it to a file under `docs/` and run `check-palette <file>`. Never accept a palette the gate rejects; explain the reason it prints.

Every text colour must reach WCAG AA (4.5:1) on all three surfaces. The gate lifts a failing colour (same hue, more lightness) and reports it, so what ships may differ slightly from what they typed; say so.

## Step 3: type (third batch)

Two optional faces, both off by default. Explain each in a line and ask:

- **Wordmark face**: sets the band name in Unbounded, capitals, tight, in flat colour. Otherwise the name uses the display face as typed.
- **Blackletter kickers**: UnifrakturCook for the small labels above headings (an accent only, never the name). Otherwise they use the display face.

## Step 4: features and audio (fourth batch)

Which sections should exist: **tour and tickets**, **merch**, **lyrics**, **press**, and the **tour map** (needs the tour). A section that is off drops out of the nav, footer, sitemap and `llms.txt`, and its routes return 404.

Audio: tracks are `<album-slug>/<NN>-<track-slug>.m4a` in a Cloudflare R2 bucket served from a custom domain. Ask for that origin (`https://audio.example.com`, https, no path), or "later".

## Step 5: hosting (fifth batch)

- **Pantheon site** machine name. If none exists yet, offer to create it. Creating it is outward-facing, so the order matters: show `terminus org:list` output, ask which org, then assemble the full command (the repo already exists, so no new repo):
  `terminus site:create <name> "<name>" nextjs-16 --org=<org> --vcs-provider=github --vcs-org=<owner> --repository-name=<repo> --no-create-repo`
  **print that exact command and get an explicit yes to that exact text before running it.** A yes to the offer is not a yes to the command. Run it as a background task, poll for the site, and watch `terminus node:builds:wait <name>.dev` (it fails with "only works for sites using external VCS" until provisioning finishes; that is expected, keep polling). The owner's scaffold skill (`jazzsequence-skills:scaffold-cpub-nextjs`) does the same end to end for a brand-new codebase if that is easier.
- **P1 site id**. P1 is required for every site from this template. Offer to list sites with the P1 MCP `list_sites` (read-only) so they can pick; never create a P1 site or page without an explicit yes.

If either is not known yet, leave it out: the answers file allows that, and `apply` says what is left.

## Step 6: write the answers, confirm, apply

1. Write `docs/init-answers.json` (gitignored) in the shape of `.claude/skills/init-band/answers.example.json`: `identity` (name, tagline, description, genre, fictional, siteUrl, optional imprint, social, offLimits), `look.palette` (the 13 roles), `type`, `features`, optional `audio.baseUrl`, optional `hosting` (`pantheonSite`, `p1SiteId`).
2. Summarise what you are about to apply in a short list (never the off-limits topics; say how many) and get a yes.
3. `pnpm exec tsx scripts/init-band.ts apply docs/init-answers.json`. It validates first and changes nothing if anything is wrong; fix what it names and run it again. **Show the whole output.** It writes `band.config.json` (with `setup.initialized: true`), the local `docs/off-limits.md`, `CLAUDE.md` and `README.md` for the band, the home page fixture's title, `.env.example`'s audio URL, installs `test-deployed-site.yml` and `sync-puck-registry.yml` when it has the facts for them, and regenerates the theme, placeholder images, icons and social card.

## Step 7: secrets (the person runs these)

Present the checklist `apply` printed, grouped as Pantheon then GitHub, and say plainly: **run these yourself in your own terminal, not here**. Each key is read from a hidden prompt (`read -rs`), handed to `terminus` or `gh`, then unset. Non-secret values (site id, URLs) are passed directly. The P1 drafts key goes on dev and test only; live gets the published-only key, so a live request can never read drafts. Secrets only apply after a rebuild. When they say they are done, name the environments you would rebuild and the exact action (the Pantheon MCP's `pantheon_rebuild_site`, per environment), and rebuild only after an explicit yes to that exact action. Do not push a commit for this: the setup commit does not exist yet and is the owner's.

Verify by name only, never value: `terminus secret:site:list <site>` and `gh secret list`. Report which names are missing.

## Step 8: check everything, then hand over the commit

1. Run, each separately and showing failures: `pnpm lint`, `pnpm typecheck`, `pnpm test`, then build and e2e with CI's placeholders (see CLAUDE.md "Commands" for the exact environment; never point a placeholder run at the real P1 host).
2. The seeded albums, shows, merch, lyrics and article are still the template's samples, and some tests and e2e checks mention them. Do not delete those checks to go green; tell the person which will need updating when they replace the content (CONTENT.md says where).
3. The change is far over the 5-file and 500-line AI commit cap. Say so, give the commit message you propose (what was set up, with the date, never the off-limits topics), and give them the exact command: `USER_COMMIT=1 git commit -m "..."` for them to run. Do not run it.
4. Remind them: publishing a page in P1 is the go-live step and is theirs to do; nothing here publishes anything.

## Quick reference

| Command | Does |
|---|---|
| `status` | `{ "initialized": bool, "name": "..." }` |
| `suggest-palette --hue N [--loudness quiet\|balanced\|loud] [--scheme analogous\|complement\|triad\|mono]` | palette JSON on stdout, contrast report on stderr |
| `check-palette <file>` | gate a palette; exit 1 and the reason if rejected |
| `apply <answers.json> [--force] [--skip-assets]` | write everything; validates first; `--skip-assets` skips the theme, image and icon regeneration |
