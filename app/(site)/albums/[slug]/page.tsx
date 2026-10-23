import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { Page } from "../../../../components/site/section";
import { TrackList } from "../../../../components/site/track-list";
import { ButtonLink } from "../../../../design-system/components/Button";
import { albums, getAlbum, getCatalog, getFeaturedAlbum } from "../../../../lib/site/catalog";
import { Breadcrumbs } from "../../../../components/site/breadcrumbs";
import { JsonLd } from "../../../../components/site/json-ld";
import { albumData } from "../../../../lib/site/structured-data";
import { LightboxImage } from "../../../../design-system/components/LightboxImage";
import { P1Page } from "../../../../components/site/p1-page";
import { getP1Page } from "../../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../../lib/site/p1-metadata";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export const generateStaticParams = () => albums.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = getAlbum((await params).slug);
  return album
    ? p1PageMetadata({ title: album.title, description: album.blurb, path: `/albums/${album.slug}`, image: album.cover, type: "music.album" })
    : {};
}

async function AlbumFallback({ params }: Props) {
  const { slug } = await params;
  // The latest release has its own feature page; keep one canonical URL for it.
  if (slug === getFeaturedAlbum().slug) permanentRedirect("/well-enough");
  const album = (await getCatalog()).find((a) => a.slug === slug);
  if (!album) notFound();
  const released = album.year !== undefined;
  return (
    <Page>
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Albums", href: "/albums" }, { name: album.title, href: `/albums/${album.slug}` }]} />
      <JsonLd data={albumData(album, `/albums/${album.slug}`)} />
      <div className="grid items-end gap-10 md:grid-cols-[20rem_1fr]">
        <LightboxImage src={album.cover} alt={`${album.title} cover art`} width={1024} height={1024} fetchPriority="high" className="w-full rounded-card border border-line" />
        <div className="space-y-5">
          <p className="font-gothic text-3xl text-magenta">{released ? album.kind : "Unreleased"}</p>
          <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
            {album.title}
          </h1>
          <p className="max-w-xl text-lg text-muted">{album.blurb}</p>
          <p className="text-sm text-dim">
            {released ? `${album.year} · ` : ""}
            {album.tracks.length > 0 ? `${album.tracks.length} songs` : "No recordings yet"}
          </p>
          <ButtonLink href="/albums" variant="outline">All albums</ButtonLink>
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em]">Track list</h2>
        {album.tracks.length > 0 ? (
          <TrackList tracks={album.tracks} />
        ) : (
        <p className="border border-line bg-surface px-6 py-5 text-muted">
          Nothing here yet. Recordings with no public release will be listed on this page.
        </p>
        )}
      </section>
      {album.gallery && album.gallery.length > 0 ? (
        <section className="grid gap-6 sm:grid-cols-2">
          {album.gallery.map((g) => (
            <LightboxImage key={g.src} src={g.src} alt={g.alt} width={g.width} height={g.height} loading="lazy" className="w-full rounded-card border border-line" />
          ))}
        </section>
      ) : null}
    </Page>
  );
}

/** The published P1 page for this album when there is one, otherwise the code version above. */
export default async function AlbumRoute({ params }: Props) {
  const { slug } = await params;
  if (slug === getFeaturedAlbum().slug) permanentRedirect("/well-enough");
  const path = `/albums/${slug}`;
  const doc = await getP1Page(path);
  if (!doc) return <AlbumFallback params={params} />;
  const album = (await getCatalog()).find((a) => a.slug === slug);
  if (!album) notFound();
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Albums", href: "/albums" }, { name: album.title, href: path }]} />
      </div>
      <JsonLd data={albumData(album, path)} />
      <P1Page data={doc} path={path} />
    </>
  );
}
