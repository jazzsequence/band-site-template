/**
 * The `type` answers, as the person gives them (a font name per role), turned into the `typography` band.config.json
 * records. A name is looked up in Fontsource; a role left out keeps what the repo has now, and a face the repo already has
 * is not looked up again, so a run that changes nothing about type needs no network.
 */
import { DEFAULT_TYPOGRAPHY, FONT_ROLES, type FontFace, type Typography } from "../theme/fonts";
import { AnswersError } from "./answers";
import { lookupFont, slugify, type FontInfo } from "./fonts";

/** What the answers file holds under `type`. Every key is optional. */
export type TypeInput = {
  display?: string;
  body?: string;
  /** null: the band name uses the display face. */
  wordmark?: { font: string; uppercase: boolean } | null;
  /** null: kickers use the display face. */
  kicker?: string | null;
};

export type ResolvedType = {
  typography: Typography;
  /** The package version for each face that had to be looked up, by Fontsource id. */
  versions: Record<string, string>;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export async function resolveTypeAnswers(
  raw: unknown,
  current: Typography = DEFAULT_TYPOGRAPHY,
  /** Whether the Fontsource package a face needs is already in package.json. A face that is not there is looked up even if it is unchanged. */
  isInstalled: (face: FontFace) => boolean = () => true,
  lookup: (name: string) => Promise<FontInfo> = lookupFont,
): Promise<ResolvedType> {
  if (raw === undefined) return { typography: current, versions: {} };
  if (!isObject(raw)) throw new AnswersError(["type must be an object"]);

  const problems: string[] = [];
  for (const key of Object.keys(raw)) {
    if (key === "wordmarkFace" || key === "accentFace") problems.push(`type.${key} was replaced by type.${key === "wordmarkFace" ? "wordmark" : "kicker"}: a font name, or null for none`);
    else if (!(FONT_ROLES as readonly string[]).includes(key)) problems.push(`type.${key} is not a known type role (${FONT_ROLES.join(", ")})`);
  }

  const versions: Record<string, string> = {};
  const face = async (role: string, name: unknown, now: FontFace | null): Promise<FontFace | null> => {
    if (typeof name !== "string" || !name.trim()) {
      problems.push(`type.${role} must be a font name`);
      return now;
    }
    if (now && slugify(name) === now.id && isInstalled(now)) return now;
    try {
      const info = await lookup(name);
      versions[info.face.id] = info.version;
      return info.face;
    } catch (e) {
      problems.push(`type.${role}: ${e instanceof Error ? e.message : e}`);
      return now;
    }
  };

  // Absent keeps what the repo has; null switches an optional role off; a name chooses it.
  const required = async (role: "display" | "body", now: FontFace) => {
    if (raw[role] === undefined) return now;
    if (raw[role] === null) {
      problems.push(`type.${role} cannot be null: ${role === "display" ? "headings" : "body copy"} need a face`);
      return now;
    }
    return (await face(role, raw[role], now)) ?? now;
  };
  const optional = async (role: "kicker", now: FontFace | null) => (raw[role] === undefined ? now : raw[role] === null ? null : face(role, raw[role], now));
  const wordmark = async (now: Typography["wordmark"]) => {
    const w = raw.wordmark;
    if (w === undefined) return now;
    if (w === null) return null;
    if (!isObject(w)) {
      problems.push("type.wordmark must be null or { font, uppercase }");
      return now;
    }
    if (typeof w.uppercase !== "boolean") problems.push("type.wordmark.uppercase must be true or false");
    const f = await face("wordmark", w.font, now);
    return f && typeof w.uppercase === "boolean" ? { ...f, uppercase: w.uppercase } : now;
  };

  const [display, body, kicker, mark] = await Promise.all([required("display", current.display), required("body", current.body), optional("kicker", current.kicker), wordmark(current.wordmark)]);
  if (problems.length) throw new AnswersError(problems);
  return { typography: { display, body, wordmark: mark, kicker }, versions };
}
