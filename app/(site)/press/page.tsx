import { promises as fs } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Markdown from "react-markdown";

import { Page } from "../../../components/site/section";
import { StandardDocumentLink } from "../../../components/site/standard-document-link";
import { P1Page } from "../../../components/site/p1-page";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({
  title: "PARIS is Making Monsters Polite",
  description: "The rising industrial pop artist discusses discomfort, power, and why explanation is a form of containment.",
  path: "/press",
  type: "article",
});

async function PressFallback() {
  const md = await fs.readFile(path.join(process.cwd(), "content", "press", "interview.md"), "utf8");
  return (
    <Page narrow>
      <StandardDocumentLink path="/press" />
      <article
        className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-[-0.03em] prose-h1:text-4xl prose-h2:text-xl prose-h2:font-body prose-h2:normal-case prose-h2:tracking-normal prose-strong:text-text prose-a:text-cyan"
      >
        {/* The article's title is a level-2 heading in the source; promote it so the page has an h1. */}
        <Markdown components={{ h2: ({ children }) => <h1>{children}</h1>, h3: ({ children }) => <h2>{children}</h2> }}>
          {md}
        </Markdown>
      </article>
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function PressRoute() {
  const doc = await getP1Page("/press");
  return doc ? <P1Page data={doc} path="/press" /> : <PressFallback />;
}
