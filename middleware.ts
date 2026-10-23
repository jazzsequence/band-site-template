import { createP1Middleware } from "@pantheon-systems/p1-next-sdk/server";
import { getP1ApiKey } from "./lib/site/p1-key";

const p1Middleware = createP1Middleware({
  cssBaseUrl: process.env.NEXT_PUBLIC_CSS_BASE_URL,
  apiToken: getP1ApiKey() ?? "",
  siteId: process.env.NEXT_PUBLIC_CSS_SITE_ID ?? "",
});

export async function middleware(request: Request) {
  return p1Middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
