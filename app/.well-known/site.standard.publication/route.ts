import { publicationUri } from "../../../lib/site/standard-site";

/** The publication's AT-URI as plain text, per standard.site. 404 until a publication exists. */
export function GET() {
  const uri = publicationUri();
  if (!uri) return new Response("Not found", { status: 404 });
  return new Response(uri, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
