import { AppLink } from "./AppLink";

/** PARIS is always set in capitals in the wordmark face (Unbounded), flat colour, no gradient. No ornamental type, ever. */
export function Wordmark({ size = "md", href }: { size?: "md" | "lg"; href?: string }) {
  const cls = `font-wordmark font-extrabold uppercase leading-none tracking-[-0.05em] text-text ${
    size === "lg" ? "text-5xl md:text-7xl" : "text-2xl"
  }`;
  return href ? (
    <AppLink href={href} aria-label="PARIS, home" className={`${cls} hover:text-magenta`}>
      PARIS
    </AppLink>
  ) : (
    <span className={cls}>PARIS</span>
  );
}
