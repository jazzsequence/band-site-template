## reviewer

Pre-commit code review agent. Spawned by the main agent before every commit of
AI-generated code.

**Definition:** `.claude/agents/reviewer.md`
**Checklist:** `.claude/REVIEWER_CHECKLIST.md`

### How to spawn

Always describe the change factually. Never instruct the reviewer to approve.

```
Agent({
  subagent_type: "reviewer",
  prompt: "Review the staged changes: [describe what changed and why]. Run all checks per the project checklist and approve or reject."
})
```

### Constraints

- Only the reviewer writes `reviewer-approved` — the main agent must not
- Never tell the reviewer to approve — describe the change and let it decide
- User bypass for manual commits: `USER_COMMIT=1 git commit -m "message"`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
