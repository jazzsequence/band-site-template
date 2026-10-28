import { createRequire } from "node:module";

import type { NextConfig } from "next";

import { isP1Configured } from "./lib/site/p1-config";
import { applyP1ApiKey } from "./lib/site/p1-key";

// The SDK reads CSS_API_KEY itself, at build time too, and instrumentation.ts does not run during `next build`. Without this the
// live build sent the drafts-default key, P1 refused it and every P1-backed route came out dynamic. Environments without the key
// (a live build before the secret is set) are left alone here: isP1Configured() is false for them and the server refuses to start.
try {
  applyP1ApiKey();
} catch {
  /* see above */
}

const require = createRequire(import.meta.url);

const origin = (url: string | undefined, fallback: string) => {
  try {
    return new URL(url || fallback).origin;
  } catch {
    return fallback;
  }
};

/**
 * Security headers (https://specification.website security checklist).
 *
 * Everything except /p1 gets the strict set. The P1 editor is deliberately excluded: it embeds a
 * same-origin canvas, talks to P1 services and loads user media, and a policy written for the public
 * pages would break it. `'unsafe-inline'` for scripts is required by Next's inline bootstrap; moving to
 * nonces means threading a nonce through the P1 middleware, which is not worth it for a site with no
 * user-supplied content or accounts. The CSP is production-only because the dev server needs eval.
 */
const audioOrigin = origin(process.env.NEXT_PUBLIC_AUDIO_BASE_URL, "https://audio.example.com");
const p1Origin = origin(process.env.NEXT_PUBLIC_CSS_BASE_URL, "https://ccr.p1.pantheon.io");

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `media-src 'self' ${audioOrigin} blob:`,
  // tile.openstreetmap.org: the tour map's tiles, requested only after a visitor clicks "Show map" (see the Privacy page).
  `connect-src 'self' ${p1Origin} https://tile.openstreetmap.org`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const baseHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const publicHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // legacy fallback for frame-ancestors
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

/**
 * Files served from public/ get Next's default `Cache-Control: public, max-age=0`, which Cloudflare in front of Pantheon treats as "do not
 * cache" (measured on both live sites: `cf-cache-status: BYPASS`), so every image was fetched from the origin each time. Local images are
 * referenced as `/images/x.jpg?v=<build>` (design-system/asset.ts), a new URL for every build, so those can be cached for good: the file
 * behind a given URL cannot change. Anything without the version (the icons, the social card, an image referenced some other way) is
 * cached for an hour and may be served stale for a day while it is refreshed, so replacing one shows up within the hour, not a year later.
 */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const SHORT_CACHE = "public, max-age=3600, stale-while-revalidate=86400";
const publicFileHeaders = [
  { source: "/images/:path*", has: [{ type: "query" as const, key: "v" }], headers: [{ key: "Cache-Control", value: IMMUTABLE_CACHE }] },
  ...["/images/:path*", "/icons/:path*", "/og-default.jpg"].map((source) => ({
    source,
    missing: [{ type: "query" as const, key: "v" }],
    headers: [{ key: "Cache-Control", value: SHORT_CACHE }],
  })),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A new value for every build; design-system/asset.ts appends it to local image URLs.
  env: {
    NEXT_PUBLIC_ASSET_VERSION: process.env.NEXT_PUBLIC_ASSET_VERSION ?? Date.now().toString(36),
    // The SDK reads the P1 base URL at build time. With placeholder credentials (CI, e2e, local checks) point it at
    // an address nothing listens on, so no code path, including the SDK's own catch-all route, can send a request
    // to the real backend, which only refuses it. Real credentials leave it as configured. See lib/site/p1-config.ts.
    ...(isP1Configured() ? {} : { NEXT_PUBLIC_CSS_BASE_URL: "http://127.0.0.1:9" }),
  },
  output: "standalone", // Required for Pantheon deployment

  // Only on Pantheon in production: locally there is no bucket to talk to.
  ...(process.env.NODE_ENV === "production" &&
    process.env.PANTHEON_ENVIRONMENT && {
      cacheHandler: "./cacheHandler.mjs",
      cacheMaxMemorySize: 0, // Let the handler own caching
    }),

  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  transpilePackages: [
    "@pantheon-systems/css-client",
    "@pantheon-systems/puck-css",
    "@pantheon-systems/p1-next-sdk",
  ],
  async headers() {
    return [
      { source: "/:path*", headers: baseHeaders },
      { source: "/((?!p1(?:/|$)).*)", headers: publicHeaders },
      ...publicFileHeaders,
    ];
  },
  // Load yjs as one external module on the server. Bundled copies of it (the ESM build in one place, the CJS build
  // in another) are what make it warn "Yjs was already imported" and break its instanceof checks.
  serverExternalPackages: ["yjs"],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Single yjs instance — duplicate copies break the P1 editor
      yjs: require.resolve("yjs"),
    };
    return config;
  },
};

export default nextConfig;
