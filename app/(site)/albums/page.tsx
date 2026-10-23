import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { AlbumCard } from "../../../design-system/components/AlbumCard";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { albums } from "../../../lib/site/catalog";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({ title: "Albums", description: "The PARIS catalogue: albums, EP, B-sides and unreleased recordings.", path: "/albums" });

function AlbumsFallback() {
  return (
    <Page>
      <SectionHeading as="h1" kicker="Music">Albums</SectionHeading>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {albums.map((a) => (
          <AlbumCard
            key={a.slug}
            title={a.title}
            year={a.year}
            cover={a.cover}
            trackCount={a.tracks.length}
            featured={a.featured}
            headingLevel="h2"
            href={a.featured ? "/well-enough" : `/albums/${a.slug}`}
          />
        ))}
      </div>
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function AlbumsRoute() {
  const doc = await getP1Page("/albums");
  return doc ? <P1Page data={doc} path="/albums" /> : <AlbumsFallback />;
}
