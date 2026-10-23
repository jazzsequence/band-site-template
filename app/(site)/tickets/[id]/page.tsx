import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Page } from "../../../../components/site/section";
import { TicketForm } from "../../../../components/site/ticket-form";
import { SectionHeading } from "../../../../design-system/components/SectionHeading";
import { TourMap } from "../../../../design-system/components/TourMap";
import { getShowById } from "../../../../lib/site/p1-content";
import { longDate, mapPoints, money, shows } from "../../../../lib/site/tour";
import { Breadcrumbs } from "../../../../components/site/breadcrumbs";
import { pageMetadata } from "../../../../lib/site/seo";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 300;

// Only the repo copy is prerendered; dates added in P1 are rendered on first request and then cached.
export const generateStaticParams = () => shows.map((s) => ({ id: s.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await getShowById((await params).id);
  return show
    ? pageMetadata({ title: `Tickets · ${show.city}`, description: `Tickets for PARIS at ${show.venue}, ${show.city}, ${longDate(show.date)}.`, path: `/tickets/${show.id}` })
    : {};
}

export default async function Tickets({ params }: Props) {
  const show = await getShowById((await params).id);
  if (!show) notFound();
  const pin = mapPoints([show]);
  return (
    <Page narrow>
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "Tour", href: "/tour" }, { name: show.city, href: `/tickets/${show.id}` }]} />
      <SectionHeading as="h1" kicker="Tickets">{show.city}</SectionHeading>
      <div className="space-y-1">
        <p className="font-display text-xl font-extrabold uppercase tracking-[-0.02em]">{show.venue}</p>
        <p className="text-muted">
          {longDate(show.date)} · Doors {show.doors}
        </p>
        {show.address && <p className="text-sm text-dim">{show.address}</p>}
      </div>
      {pin.length > 0 && <TourMap points={pin} label={`Where ${show.venue} is`} />}
      {show.status === "sold-out" ? (
        <p className="border border-dim px-6 py-4 text-muted">This show is sold out.</p>
      ) : (
        <>
          <p className="text-muted">{money(show.price)} each.</p>
          <TicketForm show={show} />
        </>
      )}
    </Page>
  );
}
