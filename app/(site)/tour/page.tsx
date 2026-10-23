import type { Metadata } from "next";

import { JsonLd } from "../../../components/site/json-ld";
import { Page } from "../../../components/site/section";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { TourDateRow } from "../../../design-system/components/TourDateRow";
import { TourMap } from "../../../design-system/components/TourMap";
import { getP1Page, getShows, rootProp } from "../../../lib/site/p1-content";
import { pageMetadata } from "../../../lib/site/seo";
import { eventData } from "../../../lib/site/structured-data";
import { dateParts, mapPoints, showId } from "../../../lib/site/tour";
import { P1Page } from "../../../components/site/p1-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getP1Page("/tour");
  return pageMetadata({
    title: rootProp(doc, "title") ?? "Tour",
    description: rootProp(doc, "description") ?? "PARIS live: tour dates, venues and tickets.",
    path: "/tour",
  });
}

/** Renders the published P1 page when there is one; otherwise the dates in data/tour.json. */
export default async function Tour() {
  const [doc, shows] = await Promise.all([getP1Page("/tour"), getShows()]);
  const events = <JsonLd data={{ "@context": "https://schema.org", "@graph": shows.map(eventData) }} />;
  if (doc) {
    return (
      <>
        {events}
        <P1Page data={doc} path="/tour" />
      </>
    );
  }
  const points = mapPoints(shows, true);
  return (
    <Page>
      {events}
      <SectionHeading as="h1" kicker="Live">Tour dates</SectionHeading>
      <ul>
        {shows.map((s) => (
          <TourDateRow
            key={showId(s)}
            {...dateParts(s.date)}
            city={s.city}
            venue={s.venue}
            capacity={s.capacity}
            status={s.status}
            href={`/tickets/${showId(s)}`}
            headingLevel="h2"
          />
        ))}
      </ul>
      {points.length > 0 && <TourMap points={points} label="Tour map" className="mt-8" />}
    </Page>
  );
}
