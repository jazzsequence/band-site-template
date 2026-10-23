import type { Metadata } from "next";

import { Page } from "../../components/site/section";
import { ButtonLink } from "../../design-system/components/Button";
import { pageMetadata } from "../../lib/site/seo";

export const metadata: Metadata = pageMetadata({ title: "Page not found", description: "That page does not exist.", path: "/404", noindex: true });

/** Rendered inside the site layout, so unknown URLs keep the header, footer and player. */
export default function NotFound() {
  return (
    <Page narrow>
      <p className="font-gothic text-3xl text-magenta">404</p>
      <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
        Nothing here
      </h1>
      <p className="text-lg text-muted">That page doesn&apos;t exist. Try one of these instead.</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/tour" variant="outline">Tour dates</ButtonLink>
        <ButtonLink href="/listen" variant="outline">Listen</ButtonLink>
      </div>
    </Page>
  );
}
