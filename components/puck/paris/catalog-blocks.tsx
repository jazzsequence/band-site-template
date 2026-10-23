import { AlbumCard } from "../../../design-system/components/AlbumCard";
import { ButtonLink } from "../../../design-system/components/Button";
import { AppLink } from "../../../design-system/components/AppLink";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { SectionHeading } from "../../../design-system/components/SectionHeading";
import { TourDateRow } from "../../../design-system/components/TourDateRow";
import albumsData from "../../../data/albums.json";
import { useSiteData } from "../../site/site-data";
import { TrackList } from "../../site/track-list";
import { dateParts, showId } from "../../../lib/site/tour";
import { toActions } from "./content-blocks";

/**
 * Blocks whose content comes from the catalog (data/albums.json plus the audio bucket and the lyrics files)
 * rather than from text typed into the editor. The album is chosen from a list, so the title, cover, year and
 * track list can never disagree with the catalog.
 */
const albumOptions = albumsData.map((a) => ({ label: a.title, value: a.slug }));
const albumField = { type: "select" as const, label: "Album", options: albumOptions };

const Loading = ({ what }: { what: string }) => (
  <div className="mx-auto w-full max-w-6xl px-6 py-8 text-muted">Loading {what}…</div>
);
const albumHref = (a: { slug: string; featured: boolean }) => (a.featured ? "/well-enough" : `/albums/${a.slug}`);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="self-start border border-line bg-surface px-6 py-5 text-muted">{children}</p>
);

function AlbumGrid({ headingLevel, includeUnreleased }: { headingLevel?: "h2" | "h3"; includeUnreleased?: string }) {
  const data = useSiteData();
  if (!data) return <Loading what="albums" />;
  const albums = data.albums.filter((a) => includeUnreleased !== "no" || a.year !== undefined);
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {albums.map((a) => (
          <AlbumCard
            key={a.slug}
            title={a.title}
            year={a.year}
            cover={a.cover}
            trackCount={a.tracks.length}
            featured={a.featured}
            headingLevel={headingLevel === "h3" ? "h3" : "h2"}
            href={albumHref(a)}
          />
        ))}
      </div>
    </div>
  );
}

/** Every album as a card, newest first. */
export const albumGridBlock = {
  label: "Album grid",
  fields: {
    headingLevel: {
      type: "radio" as const,
      label: "Card titles are headings of level",
      options: [
        { label: "h2 (directly under the page title)", value: "h2" },
        { label: "h3 (under a section heading)", value: "h3" },
      ],
    },
    includeUnreleased: {
      type: "radio" as const,
      label: "Include the Unreleased shelf",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
  },
  defaultProps: { headingLevel: "h2", includeUnreleased: "yes" },
  render: (p: { headingLevel?: "h2" | "h3"; includeUnreleased?: string }) => <AlbumGrid {...p} />,
};

function AlbumHeader({ albumSlug, kicker, meta, actions }: { albumSlug?: string; kicker?: string; meta?: string; actions?: Parameters<typeof toActions>[0] }) {
  const data = useSiteData();
  if (!data) return <Loading what="album" />;
  const album = data.albums.find((a) => a.slug === albumSlug);
  if (!album) return <Loading what="that album (check the Album choice)" />;
  const released = album.year !== undefined;
  const buttons = toActions(actions);
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid items-end gap-10 md:grid-cols-[20rem_1fr]">
        <LightboxImage src={album.cover} alt={`${album.title} cover art`} width={1024} height={1024} fetchPriority="high" className="w-full rounded-card border border-line" />
        <div className="space-y-5">
          <p className="font-gothic text-3xl text-magenta">{kicker || (released ? album.kind : "Unreleased")}</p>
          <h1 className="text-chrome font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">{album.title}</h1>
          <p className="max-w-xl text-lg text-muted">{album.blurb}</p>
          <p className="text-sm text-dim">
            {meta ||
              `${released ? `${album.year} · ` : ""}${album.tracks.length > 0 ? `${album.tracks.length} songs` : "No recordings yet"}`}
          </p>
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {buttons.map((a) => (
                <ButtonLink key={`${a.label}-${a.href}`} href={a.href} variant={a.variant ?? "primary"}>
                  {a.label}
                </ButtonLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Cover, title, year and blurb for one album, from the catalog. It carries the page's h1. */
export const albumHeaderBlock = {
  label: "Album header",
  fields: {
    albumSlug: albumField,
    kicker: { type: "text" as const, label: "Small label (blank = the release type)" },
    meta: { type: "text" as const, label: "Line under the text (blank = year and song count)" },
    actions: {
      type: "array" as const,
      label: "Buttons",
      arrayFields: {
        label: { type: "text" as const, label: "Label" },
        href: { type: "text" as const, label: "Link" },
        style: { type: "radio" as const, label: "Style", options: [{ label: "Solid", value: "primary" }, { label: "Outline", value: "outline" }] },
      },
      defaultItemProps: { label: "All albums", href: "/albums", style: "outline" },
      getItemSummary: (i: { label?: string }) => i.label || "Button",
    },
  },
  defaultProps: { albumSlug: albumOptions[0]?.value ?? "", kicker: "", meta: "", actions: [{ label: "All albums", href: "/albums", style: "outline" }] },
  render: (p: { albumSlug?: string; kicker?: string; meta?: string; actions?: Parameters<typeof toActions>[0] }) => <AlbumHeader {...p} />,
};

function AlbumTracks({ albumSlug, heading }: { albumSlug?: string; heading?: string }) {
  const data = useSiteData();
  if (!data) return <Loading what="tracks" />;
  const album = data.albums.find((a) => a.slug === albumSlug);
  if (!album) return <Loading what="that album (check the Album choice)" />;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-6">
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em]">{heading || "Track list"}</h2>
      {album.tracks.length > 0 ? <TrackList tracks={album.tracks} /> : <Empty>Nothing here yet. Recordings with no public release will be listed on this page.</Empty>}
    </div>
  );
}

/** The songs on an album, with play, add to queue, lyrics and download. Audio and lyrics are picked up automatically. */
export const trackListBlock = {
  label: "Track list",
  fields: { albumSlug: albumField, heading: { type: "text" as const, label: "Heading" } },
  defaultProps: { albumSlug: albumOptions[0]?.value ?? "", heading: "Track list" },
  render: (p: { albumSlug?: string; heading?: string }) => <AlbumTracks {...p} />,
};

function AlbumSection({ albumSlug }: { albumSlug?: string }) {
  const data = useSiteData();
  if (!data) return <Loading what="album" />;
  const album = data.albums.find((a) => a.slug === albumSlug);
  if (!album) return <Loading what="that album (check the Album choice)" />;
  return (
    <section id={album.slug} className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 md:grid-cols-[16rem_1fr]">
      <div className="space-y-3">
        <LightboxImage src={album.cover} alt={`${album.title} cover art`} width={1024} height={1024} loading="lazy" decoding="async" className="w-full rounded-card border border-line" />
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em]">
          <AppLink href={albumHref(album)} className="hover:text-magenta">
            {album.title}
          </AppLink>
        </h2>
        <p className="text-sm text-muted">{album.year ? `${album.kind} · ${album.year}` : album.kind}</p>
        <p className="text-sm text-muted">{album.blurb}</p>
      </div>
      {album.tracks.length > 0 ? <TrackList tracks={album.tracks} /> : <Empty>Nothing here yet. Recordings with no public release will be listed here.</Empty>}
    </section>
  );
}

/** A compact album card with its full track list beside it. The Listen page is one of these per album. */
export const albumSectionBlock = {
  label: "Album with tracks",
  fields: { albumSlug: albumField },
  defaultProps: { albumSlug: albumOptions[0]?.value ?? "" },
  render: (p: { albumSlug?: string }) => <AlbumSection {...p} />,
};

function TourPreview({ kicker, heading, count, linkLabel, linkHref }: { kicker?: string; heading?: string; count?: number; linkLabel?: string; linkHref?: string }) {
  const data = useSiteData();
  if (!data) return <Loading what="tour dates" />;
  const shows = data.shows.slice(0, Math.max(1, Math.min(12, Number(count) || 4)));
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <SectionHeading kicker={kicker || undefined}>{heading || "Tour dates"}</SectionHeading>
      <ul>
        {shows.map((s) => (
          <TourDateRow key={showId(s)} {...dateParts(s.date)} city={s.city} venue={s.venue} capacity={s.capacity} status={s.status} href={`/tickets/${showId(s)}`} />
        ))}
      </ul>
      {linkLabel && linkHref ? (
        <ButtonLink href={linkHref} variant="outline">
          {linkLabel}
        </ButtonLink>
      ) : null}
    </section>
  );
}

/** The next few shows from the Tour page, with a link to all of them. Edit the dates on the Tour page, not here. */
export const tourPreviewBlock = {
  label: "Tour preview",
  fields: {
    kicker: { type: "text" as const, label: "Small label above the title" },
    heading: { type: "text" as const, label: "Title" },
    count: { type: "number" as const, label: "How many shows", min: 1, max: 12 },
    linkLabel: { type: "text" as const, label: "Link label" },
    linkHref: { type: "text" as const, label: "Link" },
  },
  defaultProps: { kicker: "On the road", heading: "Tour dates", count: 4, linkLabel: "All dates", linkHref: "/tour" },
  render: (p: { kicker?: string; heading?: string; count?: number; linkLabel?: string; linkHref?: string }) => <TourPreview {...p} />,
};

function LyricsIndex() {
  const data = useSiteData();
  if (!data) return <Loading what="lyrics" />;
  const sorted = [...data.lyrics].sort((a, b) => a.title.localeCompare(b.title));
  const groups = [
    ...data.albums.map((a) => ({
      key: a.slug,
      title: a.title,
      items: sorted.filter((l) => l.album === a.slug).sort((x, y) => (x.track ?? 0) - (y.track ?? 0)),
    })),
    { key: "other", title: "More songs", items: sorted.filter((l) => !data.albums.some((a) => a.slug === l.album)) },
  ].filter((g) => g.items.length);
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-6 py-6">
      {groups.map((g) => (
        <section key={g.key} className="space-y-3">
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-violet">{g.title}</h2>
          <ul className="divide-y divide-line border-y border-line">
            {g.items.map((l) => (
              <li key={l.slug}>
                <AppLink href={`/lyrics/${l.slug}`} className="flex items-baseline justify-between gap-4 py-3 hover:text-magenta">
                  <span className="text-lg">{l.title}</span>
                  {l.track && <span className="text-sm tabular-nums text-dim">{String(l.track).padStart(2, "0")}</span>}
                </AppLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Every lyric, grouped by album. New songs appear when their lyrics file is added to the repo. */
export const lyricsIndexBlock = {
  label: "Lyrics index",
  fields: {},
  defaultProps: {},
  render: () => <LyricsIndex />,
};
