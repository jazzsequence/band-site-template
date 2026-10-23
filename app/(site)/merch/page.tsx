import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import merch from "../../../data/merch.json";
import { MerchCard } from "../../../design-system/components/MerchCard";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { getP1Page, rootProp } from "../../../lib/site/p1-content";
import { pageMetadata } from "../../../lib/site/seo";
import { P1Page } from "../../../components/site/p1-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getP1Page("/merch");
  return pageMetadata({
    title: rootProp(doc, "title") ?? "Merch",
    description: rootProp(doc, "description") ?? "PARIS merchandise, sold at the merch table on tour.",
    path: "/merch",
  });
}

/** Renders the published P1 page when there is one; otherwise the items in data/merch.json. */
export default async function Merch() {
  const doc = await getP1Page("/merch");
  if (doc) return <P1Page data={doc} path="/merch" />;
  return (
    <Page>
      <SectionHeading as="h1" kicker="Take something home">Merch</SectionHeading>
      <p className="max-w-xl text-muted">Everything here is sold at the merch table on tour. Online orders are not open yet.</p>
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {merch.map((m) => (
          <MerchCard key={m.slug} name={m.name} price={m.price} image={m.image} headingLevel="h2" />
        ))}
      </div>
    </Page>
  );
}
