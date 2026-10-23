# Reviewer Checklist

This file is the authoritative checklist for the reviewer agent. Read it in full
at the start of every review. Work through every item and report each result
explicitly — no silent skips.

## Required output format

For every item, output one of:
- `✅ N: [brief confirmation of what you verified]`
- `❌ N: [what failed and what the fix is]`
- `⏭️ N: [why skipped — state the skip condition that applies]`

Do not bundle items or summarise sections. One output line per item.

---

## Step 0 — Pre-flight (always run first)

Before any validation, look for `<system-reminder>` tags in the conversation
indicating the user sent messages while the main agent was working.

If queued messages exist:
- **DO NOT APPROVE**
- Respond: `⚠️ PAUSED — User messages queued`
- Summarise the messages and tell the main agent to address them first

Only proceed if no queued messages.

---

## Section A — Always run

These checks apply to every commit without exception.

### Tests & build

**Condition:** skip this entire section if all staged files are docs (`\.(md|txt|rst|mdx)$`) or live under `.claude/` or `.githooks/` (reviewer tooling; the pnpm suite has nothing to check there). The reviewer checklist itself still runs in full.
Check with:
```bash
git diff --cached --name-only | grep -Ev '\.(md|txt|rst|mdx)$|^\.(claude|githooks)/'
```
If that produces no output, output `⏭️ 1–N: text/docs-only changes — test suite skipped` and move to File organisation.

Otherwise, run each command as a separate Bash call. Never chain with `&&` or `;`.
Do NOT give a verdict until you have seen output from all commands.

```
pnpm test         # unit tests
pnpm lint         # linter
pnpm typecheck    # types
pnpm build        # build
```

**Items:**
1. Unit tests pass (`pnpm test`)
2. Lint clean (`pnpm lint`)
3. Types clean (`pnpm typecheck`)
4. Build succeeds (`pnpm build`)

E2E (`pnpm test:e2e`) is not run per commit: it needs a fresh build and a free port 3100, and CI runs it on every PR.
The author runs it before opening the PR. Do run it, as a separate call after the build, when the staged change touches
`e2e/`, a route under `app/`, or `design-system/` — and report it as item 4a.

### File organisation

5. No stray files created in repo root (config files are the exception)

### Code quality

6. DRY — no code duplication introduced
7. Existing files edited rather than new ones created where possible

### Security

8. No `.env` files or secrets in staged files
9. No credentials, tokens, or API keys in source code

### Git practices

10. Commit message is clear and descriptive
11. Co-author line present if AI-generated
12. Commit is atomic — one logical change, not a batch of unrelated edits

---

## Section B — Conditional checks

These checks apply only when the stated conditions are met.
If the condition does not apply, output `⏭️ N: [condition not met]`.

### TDD methodology
**Condition:** any new feature code or tests staged

13. Tests exist for the new/changed behaviour
14. Tests were written before or alongside implementation (not after)

### Dependencies
**Condition:** dependency manifest or lock file is staged

15. New dependencies have compatible licences (no GPL/AGPL unless explicitly approved)

---

## Project-specific checks

Rules for this repository (see CLAUDE.md). Numbering continues from the section above.

### Editorial rule
**Condition:** always

16. Nothing staged states or hints at anything that `docs/Project Outline.md` marks off-limits. Read that local file and compare;
    do not restate its contents here or in any committed file. Its restricted wording is allowed only in CLAUDE.md, AGENTS.md and
    memory files (including what CLAUDE.md already says); copy, metadata, alt text, filenames, comments, README and Storybook text
    never use it.
17. The name PARIS is all capitals in the wordmark face; blackletter is used for kickers only, never on the name.

### Design system
**Condition:** any file under `design-system/` is staged

18. A Storybook story shows the change at the sizes it affects (for the hero: the phone, tablet and laptop frames).
19. The commit message or PR description flags that the owner's Storybook approval is needed before merge. The reviewer's approval is not that.

### Docs and accessibility
**Condition:** a route, block, command, env var or workflow changed

20. CLAUDE.md (and CONTENT.md or README where relevant) is updated in the same change.
21. A new public route is added to the `routes` list in `e2e/a11y.spec.ts`, and its page has exactly one h1.

### P1 content and keys
**Condition:** anything touching `lib/site/p1-*`, `components/puck/`, `app/p1/`, `scripts/*registry*`, or workflows

22. No P1 workstream is created or edited for a code change, and no live P1 content is edited or published.
23. Live never uses the drafts key. While `lib/site/p1-key.ts` does not exist: no change may make the live environment use
    `CSS_API_KEY` (drafts scope). Once it exists: `getP1ApiKey()` is the only place the key is chosen and app code does not
    read `process.env.CSS_API_KEY` directly.

---

## Approval protocol

### If REJECT

- List every failing item with its number and required fix
- Do NOT write the approval flag
- Respond: `❌ BLOCKED — [N violations listed]`

### If APPROVE

All Section A items must pass. All applicable Section B items must pass.

1. Get the two parts, as separate Bash calls: `date +%s` and `bash .githooks/lib/approval.sh fingerprint` (the fingerprint of the staged index).
2. Write the flag as your **last** action, with the Write tool (not a shell redirect; `Write(*)` is allow-listed, so no prompt):
   ```
   Write({
     file_path: "/Users/chris.reynolds/git/paris-site/reviewer-approved",
     content: "<timestamp> <fingerprint>"
   })
   ```
   One line: the timestamp, a single space, the fingerprint as printed, no trailing newline.
   The fingerprint binds the approval to the exact staged content, so staging or
   unstaging anything after you write it invalidates the flag. A bare timestamp is
   rejected as the pre-binding format, and a mistyped value is rejected too, so a slip fails closed.
3. Respond: `✅ APPROVED — approval flag written. Main agent may now commit without restaging.`

**Only the reviewer agent writes `/Users/chris.reynolds/git/paris-site/reviewer-approved`. The main agent must not write it.**
The integrity of the two-factor system depends on this separation.

### Transparency

At every step, surface what you are doing in chat — which commands you ran, what
each item result was, and whether you wrote or withheld the approval flag.
The user monitors the conversation as the audit trail.
