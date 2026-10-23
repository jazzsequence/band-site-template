import type { Metadata } from "next";

import { getP1Page, rootProp } from "./p1-content";
import { pageMetadata } from "./seo";

type Defaults = Parameters<typeof pageMetadata>[0];

/** Page metadata where the published P1 page's own title and description win over the code defaults. */
export async function p1PageMetadata(defaults: Defaults): Promise<Metadata> {
  const doc = await getP1Page(defaults.path);
  return pageMetadata({
    ...defaults,
    title: rootProp(doc, "title") ?? defaults.title,
    description: rootProp(doc, "description") ?? defaults.description,
  });
}
