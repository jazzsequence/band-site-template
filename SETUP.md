# Setting up a site from the template

What you need to do outside the repo to get a band's site running. `/init-band` does the in-repo part and prints the exact
commands for the secrets; this explains the rest and why.

## 0. You will need

- Accounts: **GitHub**, **Pantheon** (with the Next.js upstream available to your organisation), **P1** (Pantheon Content
  Publisher at content.pantheon.io) and, for audio, **Cloudflare** (R2).
- Tools: Node per `.nvmrc`, pnpm, the [GitHub CLI](https://cli.github.com) (`gh auth login`), [Terminus](https://docs.pantheon.io/terminus)
  (`terminus auth:login`), and [Claude Code](https://claude.com/claude-code) for `/init-band`.

## 0a. Credentials: where each one comes from

`/init-band` prints a command for every secret, with a "Get it" line under it, but it cannot create the tokens for you. Most are shown
**once**, when you create them: have the terminal open, create the token, and paste it straight into the hidden prompt (never into the chat).
Make anything you are missing first.

- **GitHub CLI, signed in:** `gh auth login`. Setting repository secrets needs the `repo` scope and access to this repository's secrets. If
  `GITHUB_TOKEN` is set in your shell, `gh` uses it instead of your login, and a fine-grained token then needs permission to write secrets.
- **Pantheon token → `PANTHEON_MACHINE_TOKEN`** (a GitHub Actions secret **and** a Dependabot secret). Dashboard > Personal Settings > Personal
  Access Tokens > Add token ([docs](https://docs.pantheon.io/personal-access-tokens)); it is shown once. Sign Terminus in with
  `terminus auth:login` (it points you at the same page). **A new token expires 90 days after it is created**; from then on `terminus auth:login`
  fails, so the promote workflow and the deployed-site check fail until you replace it in both places: `gh secret set PANTHEON_MACHINE_TOKEN`
  and `gh secret set PANTHEON_MACHINE_TOKEN --app dependabot`. Put the date in your calendar. (An older machine token does not expire.)
- **P1 site id → `NEXT_PUBLIC_CSS_SITE_ID`** (and `hosting.p1SiteId`; not secret). In the P1 dashboard at content.pantheon.io: shown when the
  site is created, and the last part of the site's dashboard URL.
- **P1 tokens, three of them.** In the P1 dashboard, generate a token for the site and choose its scope; each is shown once. The drafts token
  (scope "All content including drafts") is `CSS_API_KEY` (dev, test and every multidev); a second, published-content-only token is `CSS_API_KEY_LIVE` (read on live);
  a third with the registry-sync scope (`write:registry`, no read access) is the `CSS_REGISTRY_API_KEY` GitHub secret. The dashboard names the
  scopes: pick the one that matches each description. Never reuse one token for another job.
- **Audio, in Cloudflare R2.** Create the bucket in the **default location**: the site lists it at `<account>.r2.cloudflarestorage.com`, so a
  bucket in a jurisdiction (EU, FedRAMP) would list as empty and every track would show "Audio unavailable".
  - `NEXT_PUBLIC_AUDIO_BASE_URL` is the bucket's **custom domain**: R2 > the bucket > Settings > Custom Domains > Add (the domain must be a zone in
    the same Cloudflare account). The `r2.dev` URL is for development only and is rate-limited.
  - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: R2 object storage > Overview > Account Details > API Tokens > Manage > Create Account API
    token, permission **Object Read only**, scoped to this bucket. Both are shown once, together
    ([docs](https://developers.cloudflare.com/r2/api/tokens/)).
  - `R2_ACCOUNT_ID`: in the Cloudflare dashboard press Ctrl/Cmd+K and search "Copy account ID". `R2_BUCKET` is the bucket's name.

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

**Typefaces.** It asks for a font name for headings and for body copy, and optionally a wordmark face (for the band name only, in capitals
or as typed) and a kicker face (the small labels above headings). Any font in [Fontsource](https://fontsource.org) works, which includes
every Google Font. It is installed as an `@fontsource` package and served from your own site, so the site makes no request to a font CDN
and visitors are not tracked by one. Setup looks each name up (it needs the network), runs `pnpm install`, and the lockfile change goes
in the setup commit. To change them later, edit `type` in the answers file it kept under `docs/` (gitignored) and run
`pnpm exec tsx scripts/init-band.ts apply docs/init-answers.json --force`. That re-applies every answer, so it also rewrites `README.md` and the
workflow files it installed: commit anything you changed in them first.

**A font that is not in Fontsource** (licensed files, a foundry) cannot be added during setup. Setup uses the nearest Fontsource face as a
stand-in, records in your `CLAUDE.md` that the real one is owed, and adding it is a design PR after setup: you supply the font files and
a licence that allows web embedding, and it goes through the design approval workflow with Storybook checked at the relevant sizes.

## 3. The P1 site

P1 is required: every page the editor builds, and the catalog blocks, come from it. The site falls back to the repository copy
of each page if P1 is unreachable, so CI and outages keep working.

1. **Create a P1 site** in the P1 dashboard (or ask Claude to list sites through the P1 MCP; it will not create one without an
   explicit yes). Note its **site id**: it goes in `band.config.json` (`hosting.p1SiteId`) and in `NEXT_PUBLIC_CSS_SITE_ID`.
2. **Create three API keys** (see step 0a for where), each for one job. Never reuse one for another:

   | Variable | Where | Scope |
   |---|---|---|
   | `CSS_API_KEY` | Pantheon, the site (dev, test and every multidev) | reads drafts and published pages |
   | `CSS_API_KEY_LIVE` | Pantheon, the site (only `live` reads it) | published pages only |
   | `CSS_REGISTRY_API_KEY` | GitHub Actions secret | the "component registry sync" token (`write:registry` only; it has no read access) |

   `NEXT_PUBLIC_CSS_BASE_URL` is `https://ccr.p1.pantheon.io` everywhere and is **required**: without it the sign-in routes return
   500 "Server configuration error". The live environment never uses the drafts key: if `CSS_API_KEY_LIVE` is missing, live returns
   500 on purpose rather than fall back to it. (Both keys are set on the site, so live's environment does hold the drafts key too; the
   code, not where the value is set, keeps live off it.)
3. **Register the blocks** once the secrets exist: push a change under `components/puck/` (the registry workflow does it) or run
   `pnpm sync:registry` with the three registry variables set.
4. **Create the pages, then publish them.** Once the band's own albums, shows, merch and copy are in the repo, run the `/init-p1-pages` skill:
   it builds every page from the repo and creates them in P1 as drafts, after you have said yes to the exact list. It never publishes; it creates
   `/privacy` first as a test page and asks you to confirm in the P1 dashboard that it is not live. Then review each page at `/p1` and publish
   it yourself. There is one P1 site and every Pantheon environment reads it; only the key differs, so content does not
   move between environments. **Publishing a page in P1 is the go-live step.** Use a P1 workstream to preview changes without
   publishing. Do not create workstreams alongside code pull requests.

## 4. The Pantheon site and its secrets

If `/init-band` did not create the Pantheon site, create it from the Next.js upstream with the GitHub repository connected
(Pantheon's GitHub App must be installed on it). The skill prints the exact `terminus site:create ... nextjs-16 ... --no-create-repo`
command for you to approve. Provisioning takes a few minutes; `terminus node:builds:wait <site>.dev` fails with "only works for sites
using external VCS" until it finishes, which is expected.

Secrets are set with `terminus secret:site:set <site> NAME value --type=env --scope=web`. `--type=env --scope=web` is required
for a value to reach `process.env` at build and runtime. `/init-band` prints each command; the keys are read from a hidden prompt
(`read -rs`), so nothing is typed into a chat or left in shell history. Run them in your own terminal. Three things to know:

- **Set every secret on the site, once, with a real value.** A Pantheon secret has a base value that every environment without one of
  its own builds with, and an environment cannot have its own until a base exists. Setting a key on `dev` and `test` only once forced a
  dummy base, which every multidev then built with and could not sign in to P1. Never set a stand-in to replace later: leave a secret
  unset until you have the real value (a non-live build serves the repo copies, and live refuses to start without its key).
- A site-level `secret:site:set` with `--rebuild` fatals in current Terminus, so none of the commands use it; rebuild afterwards.
- Secrets only take effect after a rebuild. Rebuild each environment after setting them (the Pantheon MCP's
  `pantheon_rebuild_site`, or push a commit).

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CSS_SITE_ID`, `NEXT_PUBLIC_CSS_BASE_URL` | the P1 site id and `https://ccr.p1.pantheon.io` (not secret) |
| `CSS_API_KEY`, `CSS_API_KEY_LIVE` | the P1 drafts key and the published-only key above (both on the site; live reads the second) |
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
The registry sync skips Dependabot runs on purpose. The token expires after 90 days (step 0a): replace both copies before it does.

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
| `Promote to Pantheon Environment` or `Test deployed site` fails at the Terminus login, about 90 days after setup | The Pantheon token expired. Create a new one and replace both copies (step 0a). |
| Every track shows "Audio unavailable" though the files are in the bucket | An `R2_*` variable is missing or wrong, the token cannot read the bucket, or the bucket is in a jurisdiction (the site uses the default R2 endpoint). See step 0a. |
| Every Dependabot pull request fails `Test deployed site` | `PANTHEON_MACHINE_TOKEN` is not a Dependabot secret. |
| Sign-in or `/p1` returns 500 "Server configuration error" | `NEXT_PUBLIC_CSS_BASE_URL` is blank. |
| Live fails with a 500 | `CSS_API_KEY_LIVE` is not set (deliberate: live refuses to run rather than use the drafts key). Set it and rebuild. |
| `terminus secret:site:set ... --rebuild` fatals | Drop `--rebuild` on site-level secrets and rebuild afterwards. |
| New secret has no effect | Rebuild the environment. |
| Registry sync fails on a push | The three registry secrets are missing or belong to another P1 site. |
