import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { TrackList } from "../../../components/site/track-list";
import { ButtonLink } from "../../../design-system/components/Button";
import { getCatalog, getFeaturedAlbum } from "../../../lib/site/catalog";
import { Breadcrumbs } from "../../../components/site/breadcrumbs";
import { JsonLd } from "../../../components/site/json-ld";
import { albumData } from "../../../lib/site/structured-data";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({
  title: "Well Enough",
  description: "Well Enough, the new album from PARIS, on Hostile Takeover, distributed by Interscope Records.",
  path: "/well-enough",
  image: "/images/well-enough-cover.jpg",
  type: "music.album",
});
export const revalidate = 300;

async function WellEnoughFallback() {
  const featured = getFeaturedAlbum();
  const album = (await getCatalog()).find((a) => a.slug === featured.slug);
  if (!album) return null;
  return (
    <Page>
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Albums", href: "/albums" }, { name: album.title, href: "/well-enough" }]} />
      <JsonLd data={albumData(album, "/well-enough")} />
      <div className="grid items-end gap-10 md:grid-cols-[22rem_1fr]">
        <LightboxImage src={album.cover} alt={`${album.title} cover art`} width={1024} height={1024} fetchPriority="high" className="w-full rounded-card border border-line shadow-glow-magenta" />
        <div className="space-y-5">
          <p className="font-gothic text-3xl text-magenta">New album</p>
          <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
            {album.title}
          </h1>
          <p className="max-w-xl text-lg text-muted">{album.blurb}</p>
          <p className="text-sm text-dim">Hostile Takeover, distributed by Interscope Records · {album.year}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/listen#well-enough">Listen</ButtonLink>
            <ButtonLink href="/tour" variant="outline">Tour dates</ButtonLink>
          </div>
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em]">Track list</h2>
        <TrackList tracks={album.tracks} />
      </section>
      <section className="grid gap-6 sm:grid-cols-2">
        <LightboxImage src="/images/well-enough-back.jpg" alt="Back cover and track listing" width={1024} height={1024} loading="lazy" className="w-full rounded-card border border-line" />
        <LightboxImage src="/images/inside-cover.jpg" alt="Inside cover artwork" width={1600} height={595} loading="lazy" className="w-full rounded-card border border-line" />
      </section>
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function WellEnoughRoute() {
  const doc = await getP1Page("/well-enough");
  if (!doc) return <WellEnoughFallback />;
  const featured = getFeaturedAlbum();
  const album = (await getCatalog()).find((a) => a.slug === featured.slug);
  return (
    <>
      {album && (
        <>
          <div className="mx-auto w-full max-w-6xl px-6 pt-8">
            <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Albums", href: "/albums" }, { name: album.title, href: "/well-enough" }]} />
          </div>
          <JsonLd data={albumData(album, "/well-enough")} />
        </>
      )}
      <P1Page data={doc} path="/well-enough" />
    </>
  );
}
