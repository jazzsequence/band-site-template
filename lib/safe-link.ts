/**
 * Validation for a link address an editor types into the page editor.
 *
 * Allowed: relative paths ("/bio", "about", "#top", "?q=x"), http(s) and mailto. Everything else (javascript:, data:,
 * vbscript:, file:, protocol-relative "//host", backslash tricks) returns null, so no link is made.
 *
 * Browsers strip tabs and newlines from inside a URL and ignore the case of the scheme, which is how "java\tscript:" and
 * "JaVaScRiPt:" get past a naive prefix check. So rather than normalise and hope, any whitespace or control character inside
 * the value rejects it outright.
 */

// ASCII and C1 controls, all Unicode whitespace, zero-width characters and the BOM.
// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\u0000-\u001f\u007f-\u009f\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** The address if it is safe to put in a link, else null. */
export function safeHref(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const href = input.trim();
  if (!href || href.length > 2048 || FORBIDDEN.test(href) || href.includes("\\")) return null;

  const scheme = SCHEME.exec(href);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    if (name === "mailto") return href.length > "mailto:".length ? href : null;
    if (name !== "http" && name !== "https") return null;
    try {
      const u = new URL(href);
      if (!u.hostname || u.username || u.password) return null;
    } catch {
      return null;
    }
    return href;
  }

  // Protocol-relative: "//evil.example" inherits the scheme and leaves the site.
  if (href.startsWith("//")) return null;
  return href;
}
