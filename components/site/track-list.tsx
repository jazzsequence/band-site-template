"use client";

import { TrackRow } from "../../design-system/components/TrackRow";
import type { CatalogTrack } from "../../lib/site/catalog";
import { usePlayerMaybe, type PlayerTrack } from "./player";

const toPlayer = (t: CatalogTrack): PlayerTrack => ({
  id: `${t.album}/${t.slug}`,
  title: t.title,
  album: t.albumTitle,
  cover: t.cover,
  src: t.src,
});

export function TrackList({ tracks }: { tracks: CatalogTrack[] }) {
  // In the P1 editor there is no player: the rows show, and the buttons do nothing.
  const player = usePlayerMaybe();
  const { play, enqueue, currentId, playing, justAddedId } = player ?? { play: () => undefined, enqueue: () => undefined, currentId: undefined, playing: false, justAddedId: undefined };
  const list = tracks.filter((t) => t.hasAudio).map(toPlayer);
  return (
    <ol className="border-t border-line">
      {tracks.map((t) => {
        const p = toPlayer(t);
        const isCurrent = currentId === p.id;
        return (
          <TrackRow
            key={t.slug}
            number={t.number}
            title={t.title}
            hasAudio={t.hasAudio}
            lyricsHref={t.hasLyrics ? `/lyrics/${t.slug}` : undefined}
            current={isCurrent}
            playing={isCurrent && playing}
            onPlay={() => play(p, list)}
            onQueue={() => enqueue(p)}
            justQueued={justAddedId === p.id}
            downloadHref={t.downloadHref}
          />
        );
      })}
    </ol>
  );
}
