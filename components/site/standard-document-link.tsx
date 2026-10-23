import { documentUri } from "../../lib/site/standard-site";

/** Renders the standard.site document link for a path, or nothing when that page has no record. React hoists it into <head>. */
export function StandardDocumentLink({ path }: { path: string }) {
  const uri = documentUri(path);
  return uri ? <link rel="site.standard.document" href={uri} /> : null;
}
