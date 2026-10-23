import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { albums } from "../../../lib/site/catalog";
import { getLyrics } from "../../../lib/site/lyrics";
import { AppLink } from "../../../design-system/components/AppLink";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({ title: "Lyrics", description: "Every PARIS lyric, by album.", path: "/lyrics" });

async function LyricsFallback() {
  const lyrics = await getLyrics();
  const groups = [
    ...albums.map((a) => ({
      key: a.slug,
      title: a.title,
      items: lyrics.filter((l) => l.album === a.slug).sort((x, y) => (x.track ?? 0) - (y.track ?? 0)),
    })),
    { key: "other", title: "More songs", items: lyrics.filter((l) => !albums.some((a) => a.slug === l.album)) },
  ].filter((g) => g.items.length);

  return (
    <Page narrow>
      <SectionHeading as="h1" kicker="Words">Lyrics</SectionHeading>
      {groups.map((g) => (
        <section key={g.key} className="space-y-3">
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-violet">{g.title}</h2>
          <ul className="divide-y divide-line border-y border-line">
            {g.items.map((l) => (
              <li key={l.slug}>
                <AppLink href={`/lyrics/${l.slug}`} className="flex items-baseline justify-between gap-4 py-3 hover:text-magenta">
                  <span className="text-lg">{l.title}</span>
                  {l.track && <span className="text-sm tabular-nums text-dim">{String(l.track).padStart(2, "0")}</span>}
                </AppLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function LyricsRoute() {
  const doc = await getP1Page("/lyrics");
  return doc ? <P1Page data={doc} path="/lyrics" /> : <LyricsFallback />;
}
