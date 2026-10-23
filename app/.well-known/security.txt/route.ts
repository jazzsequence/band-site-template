/**
 * RFC 9116. Needs a contact; set SECURITY_CONTACT to a mailto: or https: URL. Without one this
 * returns 404 rather than publishing a placeholder nobody reads. Expires rolls forward a year at a time.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const contact = process.env.SECURITY_CONTACT;
  if (!contact) return new Response("Not found", { status: 404 });
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://paris.jazzsequence.com").replace(/\/$/, "");
  const body = `Contact: ${contact}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${origin}/.well-known/security.txt\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
