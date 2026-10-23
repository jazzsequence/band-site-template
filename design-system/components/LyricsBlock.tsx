import { langOf } from "../lang";
export type LyricSection = { label: string; lines: string[] };

export function LyricsBlock({ title, album, sections }: { title: string; album?: string; sections: LyricSection[] }) {
  return (
    <article className="mx-auto max-w-xl space-y-10">
      <header className="space-y-2">
        {album && <p className="font-gothic text-2xl text-magenta">{album}</p>}
        <h1 lang={langOf(title)} className="text-chrome font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-5xl">{title}</h1>
      </header>
      {sections.map((s, i) => (
        <section key={`${i}-${s.label}`} className="space-y-3">
          {s.label && <h2 className="font-display text-xs uppercase tracking-[0.25em] text-violet">{s.label}</h2>}
          <p lang={langOf(s.lines.join(" "))} className="whitespace-pre-line text-lg leading-8">{s.lines.join("\n")}</p>
        </section>
      ))}
    </article>
  );
}
