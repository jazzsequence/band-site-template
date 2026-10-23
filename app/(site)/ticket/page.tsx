import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { PrintButton } from "../../../components/site/print-button";
import { ButtonLink } from "../../../design-system/components/Button";
import { TicketCard } from "../../../design-system/components/TicketCard";
import { getShowById } from "../../../lib/site/p1-content";
import { longDate } from "../../../lib/site/tour";
import { pageMetadata } from "../../../lib/site/seo";

export const metadata: Metadata = pageMetadata({ title: "Your ticket", description: "Your e-ticket.", path: "/ticket", noindex: true });

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The e-ticket is rendered entirely from the URL, so there is nothing to store or look up. */
export default async function Ticket({ searchParams }: Props) {
  const sp = await searchParams;
  const show = await getShowById(one(sp.show));
  const order = one(sp.order).replace(/[^A-Z0-9-]/gi, "").slice(0, 24);
  const name = one(sp.name).slice(0, 60);
  const qty = Math.min(6, Math.max(1, Number(one(sp.qty)) || 1));

  if (!show || !order || !name) {
    return (
      <Page narrow>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em]">No ticket here</h1>
        <p className="text-muted">This link is missing its ticket details.</p>
        <ButtonLink href="/tour">Tour dates</ButtonLink>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em]">You&apos;re in.</h1>
      <p className="text-muted">Save this page or print it. Show the code at the door.</p>
      <TicketCard
        order={order}
        name={name}
        quantity={qty}
        city={show.city}
        venue={show.venue}
        date={longDate(show.date)}
        doors={show.doors}
      />
      <PrintButton />
    </Page>
  );
}
