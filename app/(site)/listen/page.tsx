import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { TrackList } from "../../../components/site/track-list";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { getCatalog } from "../../../lib/site/catalog";
import { AppLink } from "../../../design-system/components/AppLink";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({ title: "Listen", description: "Stream and download PARIS: every album, the EP, B-sides and unreleased recordings.", path: "/listen" });
export const revalidate = 300;

async function ListenFallback() {
  const catalog = await getCatalog();
  return (
    <Page>
      <SectionHeading as="h1" kicker="Music">Listen</SectionHeading>
      {catalog.map((album) => (
        <section key={album.slug} id={album.slug} className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <div className="space-y-3">
            <LightboxImage src={album.cover} alt={`${album.title} cover art`} width={1024} height={1024} loading="lazy" decoding="async" className="w-full rounded-card border border-line" />
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em]">
              <AppLink href={album.featured ? "/well-enough" : `/albums/${album.slug}`} className="hover:text-magenta">
                {album.title}
              </AppLink>
            </h2>
            <p className="text-sm text-muted">
              {album.year ? `${album.kind} · ${album.year}` : album.kind}
            </p>
            <p className="text-sm text-muted">{album.blurb}</p>
          </div>
          {album.tracks.length > 0 ? (
            <TrackList tracks={album.tracks} />
          ) : (
            <p className="self-start border border-line bg-surface px-6 py-5 text-muted">
              Nothing here yet. Recordings with no public release will be listed here.
            </p>
          )}
        </section>
      ))}
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function ListenRoute() {
  const doc = await getP1Page("/listen");
  return doc ? <P1Page data={doc} path="/listen" /> : <ListenFallback />;
}
