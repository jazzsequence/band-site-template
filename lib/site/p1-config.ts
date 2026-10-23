/**
 * Whether this build or server has real P1 credentials. CI, the e2e run and local checks deliberately use
 * placeholders (a key containing "placeholder", an all-zeros or missing site id) so they test the repo copies,
 * and in that case the site must not ask P1 for anything: every request goes to a real backend and is
 * refused, which is noise for the people who run it. A real key and a real UUID site id are required.
 */
import { getP1ApiKey } from "./p1-key";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ZEROS = /^[0-]+$/;

type Env = Record<string, string | undefined>;

export function isP1Configured(env: Env = process.env): boolean {
  // getP1ApiKey owns which key a given environment uses (live has its own published-only key). It throws on live
  // without that key, which here simply means "not configured".
  let key = "";
  try {
    key = getP1ApiKey(env) ?? "";
  } catch {
    return false;
  }
  const site = env.NEXT_PUBLIC_CSS_SITE_ID ?? "";
  if (!key || /placeholder/i.test(key)) return false;
  return UUID.test(site) && !ZEROS.test(site);
}
