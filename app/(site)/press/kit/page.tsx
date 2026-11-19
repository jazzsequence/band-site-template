import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { P1Page } from "../../../../components/site/p1-page";
import { band } from "../../../../lib/band/config";
import { getP1Page } from "../../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../../lib/site/p1-metadata";

export const revalidate = 300;

// The press kit exists only in P1 (there is no repo copy), so this route is here for its metadata: the SDK's catch-all, which would
// otherwise serve it, sets only a title, leaving the page without a canonical URL, og:url or og:image. The title and description
// published in P1 win over these. Unlike the other sections, turning the pressKit switch off does not take the page down: it only drops
// the sitemap, llms.txt and footer entries, and unpublishing the page in P1 is what removes it (a missing page is a 404 here).
export const generateMetadata = (): Promise<Metadata> =>
  p1PageMetadata({
    title: "Press kit",
    description: `Bios, quick facts, photos and artwork for ${band.name}.`,
    path: "/press/kit",
  });

export default async function PressKitRoute() {
  const doc = await getP1Page("/press/kit");
  if (!doc) notFound();
  return <P1Page data={doc} path="/press/kit" />;
}
