import type { MetadataRoute } from "next";

import { SITE_URL } from "../lib/site/seo";

// Read at request time: the same build runs in every environment, and only live may be indexed.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const env = process.env.PANTHEON_ENVIRONMENT;
  if (env && env !== "live") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/p1", "/api/", "/ticket"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
