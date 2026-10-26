import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { ButtonLink } from "../../../design-system/components/Button";
import { band, features } from "../../../lib/band/config";
import { pageMetadata } from "../../../lib/site/seo";
import { JsonLd } from "../../../components/site/json-ld";
import { getP1Page, rootProp } from "../../../lib/site/p1-content";
import { artistData } from "../../../lib/site/structured-data";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { P1Page } from "../../../components/site/p1-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getP1Page("/bio");
  return pageMetadata({
    title: rootProp(doc, "title") ?? "Bio",
    description: rootProp(doc, "description") ?? band.description,
    path: "/bio",
    image: "/images/band-portrait.png",
  });
}

/** Renders the published P1 page when there is one; otherwise this copy. */
export default async function Bio() {
  const doc = await getP1Page("/bio");
  if (doc) {
    return (
      <>
        <JsonLd data={artistData()} />
        <P1Page data={doc} path="/bio" />
      </>
    );
  }
  return (
    <Page>
      <JsonLd data={artistData()} />
      <div className="grid items-start gap-10 md:grid-cols-[22rem_1fr]">
        <LightboxImage src="/images/band-portrait.png" alt={`${band.name}, placeholder portrait`} width={1024} height={1536} fetchPriority="high" className="w-full rounded-card border border-line" />
        <div className="space-y-6">
          <p className="font-kicker text-3xl text-accent">About</p>
          <h1 className="text-metal font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
            {band.name}
          </h1>
          <div className="space-y-4 text-lg leading-8 text-muted">
            <p>{band.description}</p>
            <p>Placeholder biography. Replace this copy in app/(site)/bio/page.tsx, or publish a /bio page in P1.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {features.tour && <ButtonLink href="/tour">Tour dates</ButtonLink>}
            {features.press && <ButtonLink href="/press" variant="outline">Press</ButtonLink>}
          </div>
        </div>
      </div>
    </Page>
  );
}
