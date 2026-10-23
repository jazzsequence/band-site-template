"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AppLink } from "./AppLink";
import { Wordmark } from "./Wordmark";

const links = [
  ["Tour", "/tour"],
  ["Listen", "/listen"],
  ["Albums", "/albums"],
  ["Lyrics", "/lyrics"],
  ["Well Enough", "/well-enough"],
  ["Press", "/press"],
  ["Bio", "/bio"],
  ["Merch", "/merch"],
] as const;

/**
 * Below 1024px the eight links collapse behind a menu button, because they cannot fit beside the wordmark.
 * The button is a real disclosure (aria-expanded, aria-controls), the list is hidden from assistive
 * technology while closed, Escape closes it and returns focus, and choosing a link closes it.
 */
export function SiteHeader({ current }: { current?: string }) {
  const [open, setOpen] = useState(false);
  const navId = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 border-b border-line bg-void/90 px-6 py-3 backdrop-blur lg:py-4">
      <Wordmark href="/" />
      <button
        ref={button}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={navId}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-card border border-line text-text hover:border-magenta lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <nav id={navId} aria-label="Primary" className={`${open ? "block" : "hidden"} w-full pb-2 lg:block lg:w-auto lg:pb-0`}>
        <ul className="flex flex-col font-display text-xs uppercase tracking-[0.18em] lg:flex-row lg:flex-wrap lg:gap-x-6">
          {links.map(([label, href]) => {
            const active = current === href;
            return (
              <li key={href}>
                <AppLink
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block py-3 hover:text-magenta lg:inline-block lg:py-2 ${
                    active
                      ? "border-l-2 border-magenta pl-3 text-text lg:border-b-2 lg:border-l-0 lg:pl-0"
                      : "pl-[calc(0.75rem+2px)] text-muted lg:pl-0"
                  }`}
                >
                  {label}
                </AppLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
