---
name: init-p1-pages
description: Create the P1 pages for a band's site (home, albums, an album page each, listen, lyrics, tour, merch, bio, press, privacy) as drafts, from the band's own repo content. Use after /init-band has run and the sample albums, shows, merch and copy have been replaced, when the site's P1 pages do not exist yet, or when asked to create or rebuild them. It never publishes anything.
---

# Create the band's P1 pages

This template is for P1 sites. Every public page can be a P1 page: P1 renders a published one, and the repo version is the fallback. This skill makes the band's pages in P1 from what is in the repo, so the band can edit them in the P1 editor at `/p1`.

Work through the steps in order. Present command output to the person yourself: they cannot see it unless you show it. P1's tools say "workstream" where their parameter names say "branch"; say "workstream" to the person.

The helper does the deterministic work: `pnpm exec tsx scripts/init-band.ts p1-pages` builds each page's definition from the repo (`--json` for the definitions, `--bio <file>` for the biography). It builds and prints only. You do the asking, the checking against P1, and the creating.

## Rules that never bend

- **Never call `publish_page`, and never publish by any other route.** Publishing a page is the go-live step and is the person's. This skill only creates drafts.
- **Nothing is created until the person has seen the exact list and said yes to it.** A yes to the idea is not a yes to the list. Re-ask if the list changes.
- **Never overwrite or edit an existing page.** A page that already exists at a path is skipped and reported. The one exception is the starter home page, and only with its own yes (step 3).
- **No workstreams.** The pages go on `main`, as drafts: per CLAUDE.md a page saved on `main` but not published is not served to visitors. Do not create a workstream alongside code changes.
- **The bio is public copy.** Check what they give you against the local off-limits list (`docs/off-limits.md`) and never mention that list. Never put a secret or token in a page.
- **Never touch another site.** Use the site id in `band.config.json` (`hosting.p1SiteId`), and check it is the one in `list_sites`.

## Step 0: is this repo ready?

1. `pnpm exec tsx scripts/init-band.ts p1-pages`. If it refuses (still the placeholder band, or no P1 site recorded), stop and say what it says: run `/init-band` first.
2. Ask: **have you replaced the sample albums, shows, merch, lyrics and the press article?** Pages made now copy what is in the repo, so the sample copy would become the P1 pages. If not, stop and point at `CONTENT.md` (it lists where each lives).
3. Confirm the site, read-only: `list_sites` must list `hosting.p1SiteId`. If it does not, stop; never use a site you did not find there.
4. The blocks must be registered on the site first. With the P1 MCP, read-only: `list_branches` for the site (note the `main` workstream's id), then `list_components` on it. If the band's blocks (`HeroBlock`, `TourDatesBlock`, `AlbumHeaderBlock` ...) are not there, stop: the registry has not been synced (`pnpm sync:registry`, or the registry workflow, or the MCP's `sync_components`). Syncing is outward-facing: print the exact command and wait for a yes.

## Step 1: the biography

The bio page needs the band's biography. Ask for it as Markdown (a few paragraphs is plenty), or whether to use the one-line band description alone for now. Save it to `docs/bio.md` (gitignored). Never invent a biography.

## Step 2: build and show the list

Run `pnpm exec tsx scripts/init-band.ts p1-pages --bio docs/bio.md` (without `--bio` if they chose the description alone) and **show the whole output**: the pages, their document paths and blocks, and anything still theirs to supply. A switched-off section (tour, merch, lyrics, press) has no page, and that is right. Note that once a `/tour` page is published, the shows come from its Tour dates block and `data/tour.json` becomes the fallback; the same is true of merch.

## Step 3: check what is already in P1

Read-only: `list_documents` on the `main` workstream. Compare paths after normalising them: the home page is `/`, every other document has no leading slash, so compare each page's `documentPath` with the listing's path with leading and trailing slashes trimmed (and `/`, or an empty path, as home). If the listing looks cut off (a round number such as 50 or 100 documents), say so and ask rather than assume the rest do not exist. Put each page in one of three groups and show them:

- **Create:** no document at that path.
- **Already exists, skipped:** a document is there. Never overwrite it. If they want it rebuilt, they delete it in P1 or tell you to leave it.
- **The starter home page:** a new P1 site starts with a "Welcome" page at `/` (a `P1WelcomeBlock`). `get_document` it. If that is all it holds, tell the person and ask for a **separate yes** to replace it with the band's home page (edit session: `check_edit_permission`, `start_edit_session`, `apply_document_edits` to remove the welcome block and add the home blocks and set the title and description, `complete_edit_session`; follow each tool's own guidance). If it holds anything else, skip it.

## Step 4: the yes

Say it in one message: "I will create these N draft pages on `main` of the P1 site `<id>`: <the list>. Nothing is published. The first, `/privacy` (or the page named as the test), is a test: I will stop after it and ask you to confirm in P1 that it is not live before I create the rest. Say yes to create them." Wait for a yes to that list.

## Step 5: create, one at a time

That pages created on `main` are drafts rests on what CLAUDE.md says, and the P1 tools give no way to read a page's published state, so test it before relying on it.

**First, the test page.** Create `/privacy` first: its content is the same as the repo's own privacy page, so if drafts turned out not to be drafts, nothing a visitor sees would change. (If `/privacy` already exists, use another page whose content equals the repo's version, such as `/albums` or `/lyrics`, never `/bio`, `/tour` or `/merch`, which differ, and say which page is the test.) Then:

1. `list_documents` again: the new page must appear. That shows drafts are listed on `main`, which step 3's comparison relies on. If it does not appear, stop.
2. Ask the person to open the site in the P1 dashboard and tell you whether that page is shown as unpublished. **Continue only when they confirm it is not live.** If it is live, or they cannot tell, stop, say so, and create nothing else.

**Then the rest**, one at a time, from the `--json` output (`pnpm exec tsx scripts/init-band.ts p1-pages --bio docs/bio.md --json`): `create_page` with `site_id`, the `main` workstream's id as `branch_id`, `document_path` (the `documentPath` field, exactly as given), `components`, and `root_props` of `{ "title": ..., "description": ... }`. Report each result as it lands. If one fails, stop, show the error, and ask; do not retry blindly, and do not carry on to the rest. Never create a page that was not in the list the person approved.

## Step 6: check and hand over

`list_documents` again and compare with the approved list; report any that are missing. Then say plainly:

- The pages are drafts as far as you confirmed it for the test page; say what you checked, not more. Open each at `/p1` to look at it and edit it.
- **Publishing is yours.** It copies the page live (`publish_page`, or merging a workstream), and it replaces that route's repo version on the live site, so look at each page first. I have not published anything.
- From then on P1 is where the content is edited. The files in `content/p1-pages/` and the code versions do not follow later edits made in P1.
- Anything the build said is still theirs to supply (for example the bio).

## Quick reference

| Command | Does |
|---|---|
| `p1-pages [--bio <file>] [--json]` | the band's P1 pages from its repo content; refuses until `/init-band` has run and a P1 site is recorded; builds and prints only |
