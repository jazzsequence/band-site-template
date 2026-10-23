"use client";

import { Page } from "../../components/site/section";
import { Button, ButtonLink } from "../../design-system/components/Button";

/** Shown when a page throws while rendering. Keeps the header, footer and player in place. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Page narrow>
      <p className="font-gothic text-3xl text-magenta">500</p>
      <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
        Something broke
      </h1>
      <p className="text-lg text-muted">That page failed to load. Try again, or head somewhere else.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">Home</ButtonLink>
      </div>
    </Page>
  );
}
