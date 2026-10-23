import { getSiteData } from "../../../lib/site/site-data";

/**
 * The same data the public pages hand to the catalog-driven blocks, for the P1 editor, whose canvas runs in
 * the browser and has no server to ask. Public information only: titles, track lists, whether audio exists.
 */
export const revalidate = 300;

export async function GET() {
  return Response.json(await getSiteData(), { headers: { "Cache-Control": "public, max-age=60" } });
}
