import { promises as fs } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "lyrics");

export type LyricSection = { label: string; lines: string[] };
export type Lyric = { slug: string; title: string; album?: string; track?: number; sections: LyricSection[] };

export function parseLyric(slug: string, raw: string): Lyric {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  const sections: LyricSection[] = [];
  let open: LyricSection | undefined;
  for (const line of (m?.[2] ?? raw).split("\n")) {
    const h = line.match(/^###\s+(.+)$/);
    if (h) {
      open = { label: h[1].trim(), lines: [] };
      sections.push(open);
    } else if (line.trim() || open?.lines.length) {
      if (!open) {
        open = { label: "", lines: [] };
        sections.push(open);
      }
      open.lines.push(line.trimEnd());
    }
  }
  for (const s of sections) while (s.lines.at(-1) === "") s.lines.pop();
  return {
    slug,
    title: meta.title ?? slug,
    album: meta.album,
    track: meta.track ? Number(meta.track) : undefined,
    sections,
  };
}

const slugs = async () => (await fs.readdir(DIR)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));

export async function getLyrics(): Promise<Lyric[]> {
  const all = await Promise.all((await slugs()).map((s) => getLyric(s) as Promise<Lyric>));
  return all.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getLyric(slug: string): Promise<Lyric | undefined> {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  try {
    return parseLyric(slug, await fs.readFile(path.join(DIR, `${slug}.md`), "utf8"));
  } catch {
    return undefined;
  }
}

export async function getLyricSlugs(): Promise<Set<string>> {
  return new Set(await slugs());
}
