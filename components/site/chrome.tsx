"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "../../design-system/components/SiteHeader";

export function Header() {
  const path = usePathname();
  const current = ["/tour", "/listen", "/albums", "/lyrics", "/well-enough", "/press", "/bio", "/merch"].find(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-magenta focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>
      <SiteHeader current={current} />
    </>
  );
}
