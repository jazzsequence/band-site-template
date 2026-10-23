import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({
  title: "Privacy",
  description: "What this site does and does not collect. Short version: nothing, unless you ask for a map.",
  path: "/privacy",
});

function PrivacyFallback() {
  return (
    <Page narrow>
      <SectionHeading as="h1" kicker="Your data">Privacy</SectionHeading>
      <div className="space-y-8 text-lg leading-8 text-muted">
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">What we collect</h2>
          <p>
            Nothing. This site sets no cookies, runs no analytics or advertising trackers, has no accounts and no
            sign-up forms, and does not store anything about you in your browser.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">Tickets</h2>
          <p>
            The ticket page is a demonstration. The name you type is placed in the address of your ticket page so it can
            be shown back to you, and is not sent to or kept by anyone. No payment details are asked for or taken.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">Who can see your visit</h2>
          <p>
            Every website is delivered by someone. Pantheon hosts the pages and, like any host, keeps ordinary server
            logs that include your IP address and what you requested. Songs are served from Cloudflare, which sees a
            request each time you play or download one. Fonts and images are served from this site itself, not from a
            third party. The one exception is the optional map, below.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">The map</h2>
          <p>
            The tour pages can show a map. It is off until you press Show map, and until then nothing is requested from
            anyone. When you press it, your browser asks OpenStreetMap, run by the OpenStreetMap Foundation, for the map
            pictures it needs, so OpenStreetMap sees your IP address and which part of the map you are looking at, as any
            website you visit would. This site does not receive or keep any of that. OpenStreetMap&rsquo;s own{" "}
            <a className="text-cyan underline underline-offset-4 hover:text-text" href="https://osmfoundation.org/wiki/Privacy_Policy">
              privacy policy
            </a>{" "}
            covers what it does with it.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">Listening</h2>
          <p>
            What you play is not recorded by this site. The player lives only in your open tab and disappears when you
            close it.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-text">Editors</h2>
          <p>
            The people who maintain the site sign in to a separate editor, which uses cookies to keep them signed in.
            Visitors never see or receive them.
          </p>
        </section>
      </div>
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function PrivacyRoute() {
  const doc = await getP1Page("/privacy");
  return doc ? <P1Page data={doc} path="/privacy" /> : <PrivacyFallback />;
}
