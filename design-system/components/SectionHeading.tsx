export function SectionHeading({
  kicker,
  children,
  as: Tag = "h2",
}: {
  kicker?: string;
  children: string;
  /** Use "h1" for the page title; every page needs exactly one. */
  as?: "h1" | "h2";
}) {
  return (
    <header className="space-y-2">
      {kicker && (
        <p className="font-gothic text-2xl text-magenta">
          {kicker}
        </p>
      )}
      <Tag className="text-chrome font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-6xl">
        {children}
      </Tag>
      <span className="block h-px w-24 bg-[image:var(--grad-neon)]" aria-hidden />
    </header>
  );
}
