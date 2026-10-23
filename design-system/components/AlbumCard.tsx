import { assetUrl } from "../asset";
import { AppLink } from "./AppLink";

export type AlbumCardProps = {
  title: string;
  /** Omit for unreleased material. */
  year?: number;
  cover: string;
  trackCount: number;
  featured?: boolean;
  href?: string;
  /** Heading level for the title; use "h2" when the card sits directly under the page h1. */
  headingLevel?: "h2" | "h3";
};

export function AlbumCard({ title, year, cover, trackCount, featured, href = "#", headingLevel: Heading = "h3" }: AlbumCardProps) {
  return (
    <AppLink
      href={href}
      className="group block overflow-hidden rounded-card border border-line bg-surface transition hover:border-magenta hover:shadow-glow-magenta"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={assetUrl(cover)}
          alt={`${title} cover art`}
          width={640}
          height={640}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        {featured && (
          <span className="absolute left-3 top-3 bg-magenta px-2 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-void">
            Latest
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <Heading className="font-display text-lg font-semibold uppercase tracking-wide">{title}</Heading>
        <p className="text-sm text-muted">
          {year ?? "Unreleased"}
          {trackCount > 0 && ` · ${trackCount} tracks`}
        </p>
      </div>
    </AppLink>
  );
}
