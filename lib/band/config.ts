/**
 * Everything band-specific that is not content: identity, which sections exist, type choices and the
 * location of the local off-limits notes. band.config.json is the source; this module validates it once
 * and exposes it typed. The palette in the same file is validated by lib/theme/palette.ts.
 */
import raw from "../../band.config.json";
import { DEFAULT_TYPOGRAPHY, readTypography, type Typography } from "../theme/fonts";

export const FEATURES = ["tour", "merch", "lyrics", "map", "press"] as const;
export type Feature = (typeof FEATURES)[number];

export type SocialLink = { label: string; url: string };

export type BandConfig = {
  band: {
    name: string;
    tagline: string;
    description: string;
    genre: string;
    /** A made-up act (a demo or a story) rather than a real one. Pages never claim otherwise. */
    fictional: boolean;
    /** Canonical origin. NEXT_PUBLIC_SITE_URL overrides it per environment. */
    siteUrl: string;
    copyrightYear: number;
    /** Optional line in the footer: the label, distributor or similar. */
    imprint?: string;
    social: SocialLink[];
  };
  features: Record<Feature, boolean>;
  /** The typefaces, by role (lib/theme/fonts.ts). Each is a self-hosted Fontsource package. */
  typography: Typography;
  /** Set by /init-band when it has run. false means this repo is still the placeholder band. */
  setup: { initialized: boolean };
  /** Where the site is hosted. Neither value is a secret; the keys and tokens never go in this file. */
  hosting: {
    /** Machine name of the Pantheon site (promote workflow, deployed-site check, terminus commands). */
    pantheonSite?: string;
    /** The P1 site id (NEXT_PUBLIC_CSS_SITE_ID; the registry sync's CSS_SITE_ID). */
    p1SiteId?: string;
  };
  editorial: {
    /**
     * Local, gitignored file listing what public copy must never state or hint at. It stays under docs/
     * (gitignored) because the list itself would give the topics away if it were committed.
     */
    offLimitsFile: string;
  };
};

export class BandConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`band.config.json rejected:\n- ${problems.join("\n- ")}`);
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function parseBandConfig(input: unknown): BandConfig {
  const problems: string[] = [];
  const root = isObject(input) ? input : {};
  const section = (key: string) => {
    const v = root[key];
    if (!isObject(v)) problems.push(`${key} must be an object`);
    return isObject(v) ? v : {};
  };
  const text = (obj: Record<string, unknown>, path: string, key: string, max: number) => {
    const v = obj[key];
    if (typeof v !== "string" || !v.trim()) problems.push(`${path}.${key} must be a non-empty string`);
    else if (v.length > max) problems.push(`${path}.${key} is ${v.length} characters; the limit is ${max}`);
    return typeof v === "string" ? v.trim() : "";
  };
  const flag = (obj: Record<string, unknown>, path: string, key: string) => {
    if (typeof obj[key] !== "boolean") problems.push(`${path}.${key} must be true or false`);
    return obj[key] === true;
  };

  const b = section("band");
  const siteUrl = text(b, "band", "siteUrl", 200);
  if (siteUrl && !/^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(siteUrl)) problems.push("band.siteUrl must be an https:// URL");
  const year = b.copyrightYear;
  if (!Number.isInteger(year) || (year as number) < 1900 || (year as number) > 2200) problems.push("band.copyrightYear must be a four-digit year");
  const imprint = b.imprint;
  if (imprint !== undefined && (typeof imprint !== "string" || !imprint.trim())) problems.push("band.imprint must be a non-empty string when present");
  const social: SocialLink[] = [];
  if (!Array.isArray(b.social)) problems.push("band.social must be a list (it can be empty)");
  else
    b.social.forEach((s, i) => {
      if (!isObject(s) || typeof s.label !== "string" || !s.label.trim() || typeof s.url !== "string" || !/^https:\/\/\S+$/.test(s.url)) {
        problems.push(`band.social[${i}] needs a label and an https:// url`);
      } else social.push({ label: s.label.trim(), url: s.url });
    });
  const config: BandConfig = {
    band: {
      name: text(b, "band", "name", 60),
      tagline: text(b, "band", "tagline", 140),
      description: text(b, "band", "description", 300),
      genre: text(b, "band", "genre", 60),
      fictional: flag(b, "band", "fictional"),
      siteUrl: siteUrl.replace(/\/$/, ""),
      copyrightYear: Number.isInteger(year) ? (year as number) : 0,
      ...(typeof imprint === "string" && imprint.trim() ? { imprint: imprint.trim() } : {}),
      social,
    },
    features: { tour: false, merch: false, lyrics: false, map: false, press: false },
    typography: DEFAULT_TYPOGRAPHY,
    setup: { initialized: false },
    hosting: {},
    editorial: { offLimitsFile: "" },
  };

  const f = section("features");
  for (const key of FEATURES) config.features[key] = flag(f, "features", key);
  for (const key of Object.keys(f)) if (!(FEATURES as readonly string[]).includes(key)) problems.push(`features.${key} is not a known feature (${FEATURES.join(", ")})`);
  // The map is part of the tour: it shows venues, so it cannot be on without the tour.
  if (config.features.map && !config.features.tour) problems.push("features.map needs features.tour: the map shows tour venues");

  config.typography = readTypography(root.typography, problems);

  // setup and hosting are optional so a config written before they existed still loads.
  const setupRaw = root.setup;
  if (setupRaw !== undefined) {
    if (!isObject(setupRaw) || typeof setupRaw.initialized !== "boolean") problems.push("setup.initialized must be true or false");
    else config.setup.initialized = setupRaw.initialized;
  }
  const hostingRaw = root.hosting;
  if (hostingRaw !== undefined) {
    if (!isObject(hostingRaw)) problems.push("hosting must be an object");
    else {
      const { pantheonSite, p1SiteId } = hostingRaw;
      if (pantheonSite !== undefined) {
        if (typeof pantheonSite !== "string" || !/^[a-z0-9][a-z0-9-]{0,49}$/.test(pantheonSite)) problems.push("hosting.pantheonSite must be a Pantheon site machine name (lowercase letters, digits, hyphens)");
        else config.hosting.pantheonSite = pantheonSite;
      }
      if (p1SiteId !== undefined) {
        if (typeof p1SiteId !== "string" || !/^[0-9a-f][0-9a-f-]{7,63}$/i.test(p1SiteId)) problems.push("hosting.p1SiteId must be a P1 site id (hex digits and hyphens)");
        else config.hosting.p1SiteId = p1SiteId;
      }
    }
  }

  const e = section("editorial");
  const file = text(e, "editorial", "offLimitsFile", 200);
  if (file && (!file.startsWith("docs/") || file.includes("..") || file.startsWith("/"))) {
    problems.push("editorial.offLimitsFile must be a path under docs/ (that folder is gitignored; the list must not be committed)");
  }
  config.editorial.offLimitsFile = file;

  if (problems.length) throw new BandConfigError(problems);
  return config;
}

const parsed = parseBandConfig(raw);

export const band = parsed.band;
export const features = parsed.features;
export const typography = parsed.typography;
export const editorial = parsed.editorial;
export const setup = parsed.setup;
export const hosting = parsed.hosting;

export const isEnabled = (feature: Feature) => features[feature];
