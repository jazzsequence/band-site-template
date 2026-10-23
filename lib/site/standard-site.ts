import config from "../../data/standard-site.json";

/**
 * standard.site verification (https://standard.site). Two proofs tie this domain to records on the
 * AT Protocol: the publication's AT-URI served at /.well-known/site.standard.publication, and a
 * <link rel="site.standard.document"> on each published page. Both come from data/standard-site.json,
 * which scripts/publish-standard-site.mjs fills in after creating the records. Until then both are absent.
 */
type Config = { publication: string | null; documents: Record<string, string> };
const { publication, documents } = config as Config;

const AT_URI = /^at:\/\/[^/\s]+\/[a-z0-9.]+\/[^/\s]+$/i;

export const publicationUri = () => (publication && AT_URI.test(publication) ? publication : null);

/** AT-URI of the document record for a site path such as "/press", or null if none is published. */
export const documentUri = (path: string) => {
  const uri = documents[path];
  return uri && AT_URI.test(uri) ? uri : null;
};
