import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

/**
 * Internal paths use client-side navigation so the persistent audio player (which lives in the
 * site layout) is not torn down by a full page load. Anything else, such as downloads, API routes,
 * in-page anchors and external URLs, stays a plain anchor.
 */
export function AppLink({ href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const internal = href.startsWith("/") && !href.startsWith("/api/") && !href.startsWith("//");
  return internal ? (
    <Link href={href} {...props}>
      {children}
    </Link>
  ) : (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
