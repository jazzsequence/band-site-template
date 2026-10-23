import { langOf } from "../lang";
import { AppLink } from "./AppLink";

export type TrackRowProps = {
  number: number;
  title: string;
  duration?: string;
  /** No audio uploaded yet: the row stays, playback and download are unavailable. */
  hasAudio?: boolean;
  lyricsHref?: string;
  /** This track is the one loaded in the player (playing or paused): highlights the row. */
  current?: boolean;
  /** This track is audibly playing: the button shows pause and pauses on click. */
  playing?: boolean;
  onPlay?: () => void;
  /** Adds the track to the end of the play queue. The button is hidden when this is not provided. */
  onQueue?: () => void;
  /** This track was just added to the queue: the queue button shows a check in place of the plus. The owner of the state clears it after a moment. */
  justQueued?: boolean;
  downloadHref?: string;
  /** Shown when there is no audio, e.g. a song that only has lyrics here. */
  unavailableLabel?: string;
};

export function TrackRow({ number, title, duration, hasAudio = true, lyricsHref, current, playing, onPlay, onQueue, justQueued, downloadHref, unavailableLabel = "Audio unavailable" }: TrackRowProps) {
  return (
    <li
      className={`grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-line px-2 py-3 ${
        current ? "bg-raised" : ""
      }`}
    >
      <span className={`font-display text-sm tabular-nums ${current ? "text-magenta" : "text-muted"}`}>
        {String(number).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p lang={langOf(title)} className={`truncate font-medium ${hasAudio ? "" : "text-muted"}`}>{title}</p>
        {!hasAudio && <p className="text-xs uppercase tracking-widest text-dim">{unavailableLabel}</p>}
      </div>
      <div className="flex items-center gap-4 text-sm">
        {lyricsHref && (
          <AppLink href={lyricsHref} className="text-violet underline-offset-4 hover:underline">
            Lyrics
          </AppLink>
        )}
        {hasAudio && (
          <>
            <span className="tabular-nums text-muted">{duration}</span>
            {onQueue && (
              <button
                type="button"
                onClick={onQueue}
                aria-label={`Add ${title} to queue`}
                className={`grid size-9 place-items-center hover:text-text ${justQueued ? "text-magenta" : "text-muted"}`}
              >
                <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden>
                  {justQueued ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M3 6h12M3 12h8M3 18h8M18 10v8m-4-4h8" />}
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onPlay}
              aria-label={`${playing ? "Pause" : "Play"} ${title}`}
              className="grid size-9 place-items-center rounded-full border border-cyan text-cyan hover:bg-cyan hover:text-void"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                {playing ? <path d="M7 5h4v14H7zm6 0h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
              </svg>
            </button>
            <a href={downloadHref ?? "#"} download aria-label={`Download ${title}`} className="text-muted hover:text-text">
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden>
                <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
              </svg>
            </a>
          </>
        )}
      </div>
    </li>
  );
}
