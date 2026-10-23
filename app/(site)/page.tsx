import type { Metadata } from "next";

import { AlbumCard } from "../../design-system/components/AlbumCard";
import { Hero } from "../../design-system/components/Hero";
import { SectionHeading } from "../../design-system/components/SectionHeading";
import { TourDateRow } from "../../design-system/components/TourDateRow";
import { ButtonLink } from "../../design-system/components/Button";
import { Page } from "../../components/site/section";
import { albums, getFeaturedAlbum } from "../../lib/site/catalog";
import { getP1Page, getShows } from "../../lib/site/p1-content";
import { dateParts, showId } from "../../lib/site/tour";
import { JsonLd } from "../../components/site/json-ld";
import { band, features } from "../../lib/band/config";
import { SITE_URL } from "../../lib/site/seo";
import { artistData } from "../../lib/site/structured-data";
import { P1Page } from "../../components/site/p1-page";
import { p1PageMetadata } from "../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({
  title: band.name,
  description: band.description,
  path: "/",
  absoluteTitle: true,
});

export const revalidate = 300;

async function HomeFallback() {
  const shows = await getShows();
  const latest = getFeaturedAlbum();
  return (
    <>
      <JsonLd
        data={[
          artistData(),
          { "@context": "https://schema.org", "@type": "WebSite", name: band.name, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#artist` } },
        ]}
      />
      <Hero
        image="/images/placeholder-wide.png"
        kicker="New album"
        title={latest.title}
        blurb="The latest release."
        // The hero's default buttons include Tour dates, which is a 404 when the tour section is off.
        actions={features.tour ? undefined : [{ label: "Listen", href: "/listen" }]}
      />
      <Page>
        {features.tour && (
          <section className="space-y-6">
            <SectionHeading kicker="On the road">Tour dates</SectionHeading>
            <ul>
              {shows.slice(0, 4).map((s) => (
                <TourDateRow
                  key={showId(s)}
                  {...dateParts(s.date)}
                  city={s.city}
                  venue={s.venue}
                  capacity={s.capacity}
                  status={s.status}
                  href={`/tickets/${showId(s)}`}
                />
              ))}
            </ul>
            <ButtonLink href="/tour" variant="outline">All dates</ButtonLink>
          </section>
        )}
        <section className="space-y-6">
          <SectionHeading kicker="Music">Albums</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {albums.map((a) => (
              <AlbumCard
                key={a.slug}
                title={a.title}
                year={a.year}
                cover={a.cover}
                trackCount={a.tracks.length}
                featured={a.featured}
                href={`/albums/${a.slug}`}
              />
            ))}
          </div>
        </section>
      </Page>
    </>
  );
}

/** The published P1 home page when there is one, otherwise the code version above. */
export default async function HomeRoute() {
  const doc = await getP1Page("/");
  if (!doc) return <HomeFallback />;
  return (
    <>
      <JsonLd
        data={[
          artistData(),
          { "@context": "https://schema.org", "@type": "WebSite", name: band.name, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#artist` } },
        ]}
      />
      <P1Page data={doc} path="/" />
    </>
  );
}
