import { band, typography } from "../../lib/band/config";
import { AppLink } from "./AppLink";

/**
 * The band name as a wordmark. With typography.wordmarkFace on it is set in capitals in the wordmark face, tight
 * and in flat colour; with it off it uses the display face, as typed. No gradient and no ornament either way.
 */
export function Wordmark({ size = "md", href }: { size?: "md" | "lg"; href?: string }) {
  const face = typography.wordmarkFace
    ? "font-wordmark font-extrabold uppercase leading-none tracking-[-0.05em]"
    : "font-display font-extrabold leading-none tracking-[-0.04em]";
  const cls = `${face} text-text ${size === "lg" ? "text-5xl md:text-7xl" : "text-2xl"}`;
  return href ? (
    <AppLink href={href} aria-label={`${band.name}, home`} className={`${cls} hover:text-accent`}>
      {band.name}
    </AppLink>
  ) : (
    <span className={cls}>{band.name}</span>
  );
}
