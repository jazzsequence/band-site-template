import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Page } from "../../../../components/site/section";
import { LyricsBlock } from "../../../../design-system/components/LyricsBlock";
import { albumTitle } from "../../../../lib/site/catalog";
import { getLyric, getLyrics } from "../../../../lib/site/lyrics";
import { AppLink } from "../../../../design-system/components/AppLink";
import { Breadcrumbs } from "../../../../components/site/breadcrumbs";
import { JsonLd } from "../../../../components/site/json-ld";
import { absoluteUrl, pageMetadata } from "../../../../lib/site/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getLyrics()).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lyric = await getLyric((await params).slug);
  return lyric
    ? pageMetadata({ title: `${lyric.title} lyrics`, description: `Lyrics to ${lyric.title} by PARIS.`, path: `/lyrics/${lyric.slug}`, type: "music.song" })
    : {};
}

export default async function LyricPage({ params }: Props) {
  const lyric = await getLyric((await params).slug);
  if (!lyric) notFound();
  return (
    <Page narrow>
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Lyrics", href: "/lyrics" }, { name: lyric.title, href: `/lyrics/${lyric.slug}` }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicComposition",
          "@id": absoluteUrl(`/lyrics/${lyric.slug}`),
          url: absoluteUrl(`/lyrics/${lyric.slug}`),
          name: lyric.title,
          lyrics: { "@type": "CreativeWork", text: lyric.sections.map((s) => [s.label, ...s.lines].filter(Boolean).join("\n")).join("\n\n") },
        }}
      />
      <LyricsBlock title={lyric.title} album={albumTitle(lyric.album)} sections={lyric.sections} />
      <AppLink href="/lyrics" className="inline-block text-sm text-violet underline-offset-4 hover:underline">
        All lyrics
      </AppLink>
    </Page>
  );
}
