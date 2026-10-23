/**
 * What /init-band collects, validated before anything is written. The answers are turned into the
 * band.config.json the rest of the repo reads, so every value goes through the same parser (and the same
 * contrast gate) the site uses at build time: a setup that passes here cannot fail the first build.
 */
import { parseBandConfig, type Feature, type SocialLink } from "../band/config";
import { resolvePalette, validatePalette, type Adjustment, type Palette } from "../theme/palette";

export type Answers = {
  identity: {
    name: string;
    tagline: string;
    description: string;
    genre: string;
    fictional: boolean;
    siteUrl: string;
    copyrightYear?: number;
    imprint?: string;
    social?: SocialLink[];
    /** Topics public copy must never state or hint at. Written to a gitignored file, never to a committed one. */
    offLimits?: string[];
  };
  look: { palette: Palette };
  type: { wordmarkFace: boolean; accentFace: boolean };
  features: Record<Feature, boolean>;
  /** Where audio is served from (the custom domain on the R2 bucket), or absent to decide later. */
  audio?: { baseUrl?: string };
  hosting?: { pantheonSite?: string; p1SiteId?: string };
  /** The GitHub user or org that owns the repo. CODEOWNERS is pointed at it so the template author is not asked to review a band's PRs. */
  github?: { owner?: string };
};

export class AnswersError extends Error {
  constructor(readonly problems: string[]) {
    super(`init answers rejected:\n- ${problems.join("\n- ")}`);
  }
}

// The config parser names fields by their place in band.config.json; the person answering knows them by the section they answered.
const asAnswerPaths = (problems: string[]) =>
  problems.map((p) => p.replace(/^band\./, "identity.").replace(/^typography\./, "type.").replace(/^palette\./, "look.palette."));

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export type ParsedAnswers = {
  answers: Answers;
  /** The band.config.json to write, with setup.initialized true and the palette as the author wrote it. */
  config: Record<string, unknown>;
  /** Text colours the gate lifted. The config keeps the author's value; the generated theme holds the lifted one. */
  adjustments: Adjustment[];
};

export function parseAnswers(raw: unknown, currentYear = new Date().getFullYear()): ParsedAnswers {
  const problems: string[] = [];
  const root = isObject(raw) ? raw : {};
  const section = (key: string): Record<string, unknown> => {
    const v = root[key];
    if (!isObject(v)) {
      problems.push(`${key} must be an object`);
      return {};
    }
    return v;
  };
  const identity = section("identity");
  const look = section("look");
  const type = section("type");
  const features = section("features");
  const audio = root.audio === undefined ? {} : isObject(root.audio) ? root.audio : (problems.push("audio must be an object"), {});
  const hosting = root.hosting === undefined ? {} : isObject(root.hosting) ? root.hosting : (problems.push("hosting must be an object"), {});
  const github = root.github === undefined ? {} : isObject(root.github) ? root.github : (problems.push("github must be an object"), {});
  const owner = github.owner;
  if (owner !== undefined && (typeof owner !== "string" || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner))) {
    problems.push("github.owner must be a GitHub user or organisation name (letters, digits, hyphens)");
  }

  const offLimits = identity.offLimits;
  if (offLimits !== undefined) {
    if (!Array.isArray(offLimits) || offLimits.length > 50 || offLimits.some((t) => typeof t !== "string" || !t.trim() || t.length > 300)) {
      problems.push("identity.offLimits must be a list of up to 50 non-empty strings of at most 300 characters");
    }
  }
  const baseUrl = audio.baseUrl;
  if (baseUrl !== undefined && (typeof baseUrl !== "string" || !/^https:\/\/[^\s/]+$/.test(baseUrl))) {
    problems.push("audio.baseUrl must be an https:// origin with no path, such as https://audio.example.com");
  }

  // Everything the site reads goes through its own parser, so the messages match what the build would say.
  const config = {
    band: {
      name: identity.name,
      tagline: identity.tagline,
      description: identity.description,
      genre: identity.genre,
      fictional: identity.fictional,
      siteUrl: identity.siteUrl,
      copyrightYear: identity.copyrightYear ?? currentYear,
      ...(identity.imprint !== undefined ? { imprint: identity.imprint } : {}),
      social: identity.social ?? [],
    },
    features,
    typography: { wordmarkFace: type.wordmarkFace, accentFace: type.accentFace },
    setup: { initialized: true },
    ...(Object.keys(hosting).length ? { hosting } : {}),
    editorial: { offLimitsFile: "docs/off-limits.md" },
    palette: look.palette,
  };
  try {
    parseBandConfig(config);
  } catch (e) {
    problems.push(...asAnswerPaths((e as { problems?: string[] }).problems ?? [String(e)]));
  }
  let adjustments: Adjustment[] = [];
  try {
    adjustments = resolvePalette(validatePalette(look.palette)).adjustments;
  } catch (e) {
    problems.push(...asAnswerPaths((e as { problems?: string[] }).problems ?? [String(e)]));
  }
  if (problems.length) throw new AnswersError(problems);

  return {
    answers: {
      identity: { ...(identity as Answers["identity"]), copyrightYear: config.band.copyrightYear as number },
      look: { palette: validatePalette(look.palette) },
      type: config.typography as Answers["type"],
      features: features as Answers["features"],
      ...(baseUrl ? { audio: { baseUrl: baseUrl as string } } : {}),
      ...(Object.keys(hosting).length ? { hosting: hosting as Answers["hosting"] } : {}),
      ...(owner ? { github: { owner: owner as string } } : {}),
    },
    config,
    adjustments,
  };
}
