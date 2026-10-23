import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { ButtonLink } from "../../../design-system/components/Button";
import { AppLink } from "../../../design-system/components/AppLink";
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
    description: rootProp(doc, "description") ?? "About PARIS: the independent EP, the album Well Enough on Hostile Takeover, and life on tour.",
    path: "/bio",
    image: "/images/paris-portrait.jpg",
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
        <LightboxImage src="/images/paris-portrait.jpg" alt="PARIS" width={1024} height={1536} fetchPriority="high" className="w-full rounded-card border border-line" />
        <div className="space-y-6">
          <p className="font-gothic text-3xl text-magenta">About</p>
          <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
            PARIS
          </h1>
          <div className="space-y-4 text-lg leading-8 text-muted">
            <p>
              PARIS makes industrial pop that sounds expensive, intentional and quietly hostile to interpretation. The
              self-released{" "}
              <AppLink className="text-cyan underline underline-offset-4 hover:text-text" href="/albums/ep">
                debut EP
              </AppLink>
              , led by &ldquo;Consent of the Quiet&rdquo; and &ldquo;Don&rsquo;t Ask What I Am,&rdquo; drew{" "}
              <AppLink className="text-cyan underline underline-offset-4 hover:text-text" href="/press">
                national press
              </AppLink>{" "}
              and a following that arrived faster than anyone expected.
            </p>
            <p>
              Based in the Bay Area, PARIS has been performing since 1996 and writes, performs and produces every record
              alone.{" "}
              <AppLink className="text-cyan underline underline-offset-4 hover:text-text" href="/well-enough">
                Well Enough
              </AppLink>
              , the full-length, came out in 1997 on PARIS&rsquo;s own label, Hostile Takeover, with distribution by
              Interscope Records.{" "}
              <AppLink className="text-cyan underline underline-offset-4 hover:text-text" href="/albums/tribute">
                Tribute
              </AppLink>
              , a collection of B-sides, followed. This fall PARIS takes the band across the West Coast, the Southwest and
              the Rockies.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/tour">Tour dates</ButtonLink>
            <ButtonLink href="/press" variant="outline">Read the interview</ButtonLink>
          </div>
        </div>
      </div>
    </Page>
  );
}
