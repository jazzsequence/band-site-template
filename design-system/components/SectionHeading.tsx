import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  children,
  as: Tag = "h2",
}: {
  /** Text, or the editable element the page editor passes while a page is being edited in place. Drawn as given. */
  kicker?: ReactNode;
  children: ReactNode;
  /** Use "h1" for the page title; every page needs exactly one. */
  as?: "h1" | "h2";
}) {
  return (
    <header className="space-y-2">
      {kicker && (
        <p className="font-kicker text-2xl text-accent">
          {kicker}
        </p>
      )}
      <Tag className="text-metal font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-6xl">
        {children}
      </Tag>
      <span className="block h-px w-24 bg-[image:var(--grad-accent)]" aria-hidden />
    </header>
  );
}
