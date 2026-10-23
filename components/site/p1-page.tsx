import type { Data } from "@puckeditor/core";

import { getSiteData } from "../../lib/site/site-data";
import { Client } from "../../app/(site)/[...puckPath]/client";
import { SiteDataProvider } from "./site-data";

/** Renders a published P1 page, with the catalog data its blocks may need already loaded. */
export async function P1Page({ data, path }: { data: Data; path: string }) {
  return (
    <SiteDataProvider initial={await getSiteData()}>
      <Client data={data} pageMetadata={{ route: path }} />
    </SiteDataProvider>
  );
}
