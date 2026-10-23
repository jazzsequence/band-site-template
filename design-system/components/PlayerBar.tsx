"use client";

import { useEffect, useRef, useState } from "react";
import { langOf } from "../lang";
import { assetUrl } from "../asset";

export type PlayerBarProps = {
  title: string;
  album: string;
  cover: string;
  elapsed: string;
  duration: string;
  progress: number; // 0-100
  playing?: boolean;
  onToggle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Shuffle is on. The button shows only when `onShuffle` is given. */
  shuffle?: boolean;
  onShuffle?: () => void;
  /** What happens at the end of a track: nothing, the whole queue again, or this track again. The button shows only when `onRepeat` is given and cycles through the modes. */
  repeat?: RepeatMode;
  onRepeat?: () => void;
  /** A brief confirmation shown above the bar, such as "Added Say when to the queue". The owner of the state clears it after a few seconds. It is for sighted users only; announce the same words in a live region. */
  notice?: string;
  /** Called with a 0-100 position when the progress bar is clicked. */
  onSeek?: (percent: number) => void;
  /** Tracks that will play in order. The queue button is hidden when this is empty. */
  queue?: QueueItem[];
  currentId?: string;
  onSelect?: (id: string) => void;
  /** Removes a queue entry. Not offered for the current one. */
  onRemove?: (id: string) => void;
  /** Empties the queue except for the current track. The button shows only when something else is queued. */
  onClear?: () => void;
};

export type RepeatMode = "off" | "all" | "one";

export type QueueItem = { id: string; title: string; subtitle?: string };

/** Persistent bottom player. Lives in the root layout so playback follows the visitor. */
export function PlayerBar({ title, album, cover, elapsed, duration, progress, playing, onToggle, onPrev, onNext, shuffle = false, onShuffle, repeat = "off", onRepeat, notice, onSeek, queue = [], currentId, onSelect, onRemove, onClear }: PlayerBarProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // A long queue opens scrolled to the track that is playing.
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "center" });
  }, [open]);

  // Close on outside click; Escape (handled below) returns focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <section
      aria-label="Audio player"
      className="relative grid grid-cols-[auto_1fr] items-center gap-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:grid-cols-[16rem_1fr_16rem]"
    >
      {notice && (
        // Keyed on the text so a different track replays the entrance. aria-hidden: a live region elsewhere says it aloud.
        <p
          key={notice}
          aria-hidden
          className="pointer-events-none absolute bottom-full left-1/2 mb-3 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-notice-in items-center gap-2 border border-magenta bg-raised px-4 py-2 text-sm text-text shadow-glow-magenta"
        >
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-magenta stroke-[2.5]">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          <span className="truncate">{notice}</span>
        </p>
      )}
      <div className="flex min-w-0 items-center gap-3">
        <img src={assetUrl(cover)} alt="" width={48} height={48} className="size-12 rounded-card object-cover" />
        <div className="min-w-0">
          <p lang={langOf(title)} className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-muted">{album}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 sm:gap-5">
          {onShuffle && (
            <button
              type="button"
              onClick={onShuffle}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              className={`rounded-full p-1 hover:text-text ${shuffle ? "text-magenta" : "text-muted"}`}
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden>
                <path d="M3 7h3c2 0 3 1 4.5 3.5S14 15 16 15h5m0 0-3-3m3 3-3 3M3 17h3c1.4 0 2.4-.5 3.3-1.6M21 7h-5c-1.2 0-2.1.4-2.8 1.1m7.8-1.1-3-3m3 3-3 3" />
              </svg>
            </button>
          )}
          <button type="button" onClick={onPrev} aria-label="Previous track" className="text-muted hover:text-text">
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M6 5h2v14H6zm3.5 7L19 5v14z" /></svg>
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid size-10 place-items-center rounded-full bg-magenta text-void shadow-glow-magenta"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button type="button" onClick={onNext} aria-label="Next track" className="text-muted hover:text-text">
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M16 5h2v14h-2zM5 5l9.5 7L5 19z" /></svg>
          </button>
          {onRepeat && (
            <button
              type="button"
              onClick={onRepeat}
              aria-label={`Repeat: ${repeat === "one" ? "this track" : repeat === "all" ? "all" : "off"}`}
              className={`relative rounded-full p-1 hover:text-text ${repeat === "off" ? "text-muted" : "text-magenta"}`}
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden>
                <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3" />
              </svg>
              {repeat === "one" && (
                <span aria-hidden className="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-magenta text-[0.6rem] font-bold leading-none text-void">1</span>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs tabular-nums text-muted">
          <span>{elapsed}</span>
          {/* A real range input (transparent, over the visual bar) so seeking works with a
              keyboard, touch and screen readers, not just a mouse. */}
          <div className="relative flex h-6 flex-1 items-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-cyan">
            <div className="h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full bg-[image:var(--grad-neon)]" style={{ width: `${progress}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={progress}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              aria-label="Seek"
              aria-valuetext={`${elapsed} of ${duration}`}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </div>
          <span>{duration}</span>
        </div>
      </div>
      {queue.length > 0 && (
        <div
          ref={wrap}
          // Presentation only: this wrapper just catches Escape from the controls inside it.
          role="presentation"
          className="relative col-span-2 flex justify-end md:col-span-1"
          onKeyDown={(e) => {
            if (e.key === "Escape" && open) {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls="player-queue"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 py-2 text-xs uppercase tracking-widest text-violet hover:underline"
          >
            Queue
            <span className="tabular-nums text-muted">({queue.length})</span>
          </button>
          {open && (
            <div
              id="player-queue"
              ref={panel}
              role="region"
              aria-label="Queue"
              className="absolute bottom-full right-0 mb-3 max-h-[50vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto border border-line bg-raised shadow-glow-magenta"
            >
              {onClear && queue.length > 1 && (
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <span className="text-xs uppercase tracking-widest text-muted">{queue.length} in queue</span>
                  <button
                    type="button"
                    onClick={onClear}
                    className="py-1 text-xs uppercase tracking-widest text-violet hover:underline"
                  >
                    Clear queue
                  </button>
                </div>
              )}
              <ol>
                {queue.map((item, i) => (
                  <li key={item.id} className="flex items-stretch border-b border-line last:border-b-0">
                    <button
                      type="button"
                      aria-current={item.id === currentId ? "true" : undefined}
                      onClick={() => onSelect?.(item.id)}
                      className={`grid min-w-0 flex-1 grid-cols-[2rem_1fr] items-center gap-2 px-4 py-3 text-left hover:bg-surface ${
                        item.id === currentId ? "text-magenta" : "text-text"
                      }`}
                    >
                      <span className="text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0">
                        <span lang={langOf(item.title)} className="block truncate text-sm font-semibold">{item.title}</span>
                        {item.subtitle && <span className="block truncate text-xs text-muted">{item.subtitle}</span>}
                      </span>
                    </button>
                    {onRemove && item.id !== currentId && (
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${item.title} from queue`}
                        className="grid w-11 place-items-center text-muted hover:bg-surface hover:text-text"
                      >
                        <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" aria-hidden>
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
