import { createRequire } from "node:module";

import type { NextConfig } from "next";

import { isP1Configured } from "./lib/site/p1-config";

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
const audioOrigin = origin(process.env.NEXT_PUBLIC_AUDIO_BASE_URL, "https://music.paris.jazzsequence.com");
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
