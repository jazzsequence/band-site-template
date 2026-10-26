# Setting up a site from the template

What you need to do outside the repo to get a band's site running. `/init-band` does the in-repo part and prints the exact
commands for the secrets; this explains the rest and why.

## 0. You will need

- Accounts: **GitHub**, **Pantheon** (with the Next.js upstream available to your organisation), **P1** (Pantheon Content
  Publisher at content.pantheon.io) and, for audio, **Cloudflare** (R2).
- Tools: Node per `.nvmrc`, pnpm, the [GitHub CLI](https://cli.github.com) (`gh auth login`), [Terminus](https://docs.pantheon.io/terminus)
  (`terminus auth:login`), and [Claude Code](https://claude.com/claude-code) for `/init-band`.

## 1. Create the repository and set it up for CI

Create a repository from the template and clone it. Then, in the repository's GitHub settings:

| Setting | Why |
|---|---|
| **Pages: deploy from the `gh-pages` branch, `/ (root)`** | Storybook previews for each pull request are published there. A public repository, or a paid plan, is required. Until Pages is on, the preview link 404s (about a minute after the workflow turns green, once it is on). |
| **Rulesets: if you require status checks, exclude `gh-pages`** | The preview workflow pushes to `gh-pages`, which can never satisfy a required check. A ruleset that applies to every branch (`~ALL`) rejects that push with `GH013: Required status check "..." is expected`. Target the default branch only, or add an exclude for `refs/heads/gh-pages`. |
| **Required checks** | Require `Test (no Pantheon)`. It needs no secrets. Add `Build and publish Storybook` if a broken Storybook should block merges, and `Test deployed site` only once that workflow passes (see step 5). A required check is the *job* name, not the workflow name: a check called `Storybook preview` would never report and would block every merge. |
| **Branch protection on `design`** | Design changes are approved by the owner merging a `design-<topic>` pull request into `design`; protect it so that is true. Cut design branches from a freshly pulled `main`. |
| **Dependabot alerts on** | The Dependabot config ignores two known-bad major versions; an ignore also hides security-update PRs for that range, so the alerts are the signal that survives. |
| **Merge method** | Squash by default. Design-flow pull requests (into `design`, and `design` into `main`) use a merge commit so `design` stays an ancestor of `main`. |

## 2. Run `/init-band`

Open the repository in Claude Code and run `/init-band` (or `pnpm init-band` by hand: see `.claude/skills/init-band/SKILL.md`).
When it finishes it has rewritten `band.config.json`, `CLAUDE.md` and `README.md`, installed the workflows it had the facts for,
and listed the secrets to set. The setup touches far more files than an AI commit may (5 files, 500 lines), so it gives you the
`USER_COMMIT=1 git commit` to run yourself.

## 3. The P1 site

P1 is required: every page the editor builds, and the catalog blocks, come from it. The site falls back to the repository copy
of each page if P1 is unreachable, so CI and outages keep working.

1. **Create a P1 site** in the P1 dashboard (or ask Claude to list sites through the P1 MCP; it will not create one without an
   explicit yes). Note its **site id**: it goes in `band.config.json` (`hosting.p1SiteId`) and in `NEXT_PUBLIC_CSS_SITE_ID`.
2. **Create three API keys**, each for one job. Never reuse one for another:

   | Variable | Where | Scope |
   |---|---|---|
   | `CSS_API_KEY` | Pantheon, `dev` and `test` | reads drafts and published pages |
   | `CSS_API_KEY_LIVE` | Pantheon, `live` | published pages only |
   | `CSS_REGISTRY_API_KEY` | GitHub Actions secret | the "component registry sync" token (`write:registry` only; it has no read access) |

   `NEXT_PUBLIC_CSS_BASE_URL` is `https://ccr.p1.pantheon.io` everywhere and is **required**: without it the sign-in routes return
   500 "Server configuration error". The live environment never uses the drafts key: if `CSS_API_KEY_LIVE` is missing, live returns
   500 on purpose rather than fall back to it.
3. **Register the blocks** once the secrets exist: push a change under `components/puck/` (the registry workflow does it) or run
   `pnpm sync:registry` with the three registry variables set.
4. **Publish pages in P1.** There is one P1 site and every Pantheon environment reads it; only the key differs, so content does not
   move between environments. **Publishing a page in P1 is the go-live step.** Use a P1 workstream to preview changes without
   publishing. Do not create workstreams alongside code pull requests.

## 4. The Pantheon site and its secrets

If `/init-band` did not create the Pantheon site, create it from the Next.js upstream with the GitHub repository connected
(Pantheon's GitHub App must be installed on it). The skill prints the exact `terminus site:create ... nextjs-16 ... --no-create-repo`
command for you to approve. Provisioning takes a few minutes; `terminus node:builds:wait <site>.dev` fails with "only works for sites
using external VCS" until it finishes, which is expected.

Secrets are set with `terminus secret:site:set <site>[.env] NAME value --type=env --scope=web`. `--type=env --scope=web` is required
for a value to reach `process.env` at build and runtime. `/init-band` prints each command; the keys are read from a hidden prompt
(`read -rs`), so nothing is typed into a chat or left in shell history. Run them in your own terminal. Two things to know:

- A site-level `secret:site:set` with `--rebuild` fatals in current Terminus, so only the per-environment keys use it.
- Secrets only take effect after a rebuild. Rebuild each environment after setting them (the Pantheon MCP's
  `pantheon_rebuild_site`, or push a commit).

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CSS_SITE_ID`, `NEXT_PUBLIC_CSS_BASE_URL` | the P1 site id and `https://ccr.p1.pantheon.io` (not secret) |
| `CSS_API_KEY` (`dev`, `test`), `CSS_API_KEY_LIVE` (`live`) | the P1 keys above |
| `NEXT_PUBLIC_AUDIO_BASE_URL` | the audio origin, `https://audio.example.com` (not secret) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | a read-only R2 token, used on the server to list tracks |
| `SECURITY_CONTACT` (optional) | a `mailto:` or `https:` URL; `/.well-known/security.txt` returns 404 until it is set |

## 5. GitHub Actions secrets

The checks that run on every pull request need none. The rest:

| Workflow | Needs | When |
|---|---|---|
| `Test` (lint, types, unit, build, e2e) | nothing | always |
| `Storybook preview` | nothing (uses the built-in token); needs Pages and the ruleset note above | always |
| `Promote to Pantheon Environment` | `PANTHEON_MACHINE_TOKEN` (the site name is `PANTHEON_SITE_NAME` in the workflow file, which `/init-band` sets) | pushes to the `test` and `live` branches |
| `Test deployed site` (installed from `examples/workflows/`) | `PANTHEON_MACHINE_TOKEN` | every pull request and push to `main`; add it as a required check only once it passes |
| `Sync Puck Component Registry` (installed from `examples/workflows/`) | `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` | pushes touching `components/puck/**` or `puck.config.tsx` |

Set `PANTHEON_MACHINE_TOKEN` **both** as an Actions secret and as a **Dependabot** secret (`gh secret set NAME --app dependabot`):
Dependabot runs see only Dependabot secrets, so without the second copy every Dependabot pull request fails the deployed-site check.
The registry sync skips Dependabot runs on purpose.

## 6. Audio

Tracks are `<album-slug>/<NN>-<track-slug>.m4a` in an R2 bucket served from a custom domain (`NEXT_PUBLIC_AUDIO_BASE_URL`). The
site lists the bucket every five minutes, so a new file appears without a deploy; a track with no file shows "Audio unavailable".
Downloads go through `/api/download`, which adds the right headers. The `<audio>` element deliberately has no `crossOrigin`, so the
bucket needs no CORS rules for playback. Audio is never committed to git.

## 7. Deploying and going live

Pushing to `main` updates `dev`. Pushing to the `test` or `live` branch tags the release (`pantheon_test_N`, `pantheon_live_N`) and
Pantheon builds that environment. Before the first live promotion: the live key is set, the audio variables are set, the P1 pages
you want are published, and `robots.txt` will allow indexing on live only (every other environment blocks it).

## 8. Keep these current

- If you add anything that makes a third-party request or stores anything about a visitor, update the Privacy page in the same
  change (the repository copy, the page's code fallback and the published P1 page) and the content security policy in
  `next.config.ts`. The tour map is the first case: it contacts OpenStreetMap, and only after a visitor clicks "Show map".
- `CLAUDE.md` is the project's memory for Claude Code. Keep it current when workflows or architecture change.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Storybook preview job fails at the push with `GH013 ... Required status check "..." is expected` | A ruleset covers `gh-pages`. Exclude it (step 1). |
| Storybook preview link returns 404 | Pages is not enabled, or the site has not yet updated (about a minute). |
| Every Dependabot pull request fails `Test deployed site` | `PANTHEON_MACHINE_TOKEN` is not a Dependabot secret. |
| Sign-in or `/p1` returns 500 "Server configuration error" | `NEXT_PUBLIC_CSS_BASE_URL` is blank. |
| Live fails with a 500 | `CSS_API_KEY_LIVE` is not set (deliberate: live refuses to run rather than use the drafts key). Set it and rebuild. |
| `terminus secret:site:set ... --rebuild` fatals | Drop `--rebuild` on site-level secrets and rebuild afterwards. |
| New secret has no effect | Rebuild the environment. |
| Registry sync fails on a push | The three registry secrets are missing or belong to another P1 site. |
