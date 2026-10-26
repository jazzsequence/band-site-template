/** The README a configured band's repo starts with. The template's own README documents the template, so it is replaced. */
import type { Answers } from "./answers";

export function renderReadme(a: Answers): string {
  const id = a.identity;
  const host = a.hosting ?? {};
  return `# ${id.name}

${id.tagline}

${id.description}

${id.fictional ? "_This is a fictional act; nothing here is a real band, show or release._\n\n" : ""}Built with Next.js 16, edited with [P1](https://content.pantheon.io) and Puck, and hosted on Pantheon${host.pantheonSite ? ` (\`${host.pantheonSite}\`)` : ""}. Live at ${id.siteUrl}.

## Working on it

| Command | Purpose |
|---|---|
| \`pnpm install\` | Install (Node per \`.nvmrc\`, pnpm) |
| \`pnpm dev\` | Development server (copy \`.env.example\` to \`.env\` first; it regenerates the theme) |
| \`pnpm lint\`, \`pnpm typecheck\`, \`pnpm test\` | Checks required before a change |
| \`pnpm build\`, \`pnpm test:e2e\` | Production build, then axe, keyboard and navigation tests against it |
| \`pnpm theme\` | Regenerate the theme after changing the palette in \`band.config.json\` |
| \`pnpm storybook\` | The design system |

- **Hosting, secrets and the first deploy** are in [SETUP.md](SETUP.md).
- **The band itself** (name, tagline, sections, type, palette, hosting) is \`band.config.json\`.
- **Content** (albums, tour dates, merch, lyrics, press) is files in \`data/\` and \`content/\`, plus pages edited in P1: see [CONTENT.md](CONTENT.md).
- **Architecture, workflows and the reasons behind them** are in [CLAUDE.md](CLAUDE.md).
`;
}
