import { band, typography } from "../../lib/band/config";
import { AppLink } from "./AppLink";

/**
 * The band name as a wordmark. With typography.wordmark set it is in that face, tight and in flat colour (in capitals
 * when typography.wordmark.uppercase is on); with it null it uses the display face, as typed. No gradient and no
 * ornament either way.
 */
export function Wordmark({ size = "md", href }: { size?: "md" | "lg"; href?: string }) {
  const face = typography.wordmark
    ? `font-wordmark font-extrabold leading-none tracking-[-0.05em]${typography.wordmark.uppercase ? " uppercase" : ""}`
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
