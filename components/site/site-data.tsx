"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { SiteData } from "../../lib/site/site-data";

const Ctx = createContext<SiteData | null>(null);

/**
 * Gives catalog-driven blocks their data. On public pages the server passes it in, so the first render already
 * has it (no flash, and it is in the HTML). In the P1 editor there is no server render, so it is fetched.
 */
export function SiteDataProvider({ initial, children }: { initial?: SiteData; children: React.ReactNode }) {
  const [data, setData] = useState<SiteData | null>(initial ?? null);

  useEffect(() => {
    if (initial) return;
    let live = true;
    fetch("/api/site-data")
      .then((r) => (r.ok ? (r.json() as Promise<SiteData>) : null))
      .then((d) => live && d && setData(d))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [initial]);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

/** The site data, or null while the editor is still fetching it. */
export const useSiteData = () => useContext(Ctx);
