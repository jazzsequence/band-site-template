"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { PlayerBar, type RepeatMode } from "../../design-system/components/PlayerBar";
import { neighbour, NEXT_REPEAT, playOrder, rankAfter, repeatLabel, rerank } from "../../lib/site/player-order";

export type PlayerTrack = {
  id: string;
  title: string;
  album: string;
  cover: string;
  src: string;
};

/** One slot in the queue. The same song can be queued twice, so slots have their own id. `rank` orders the slots while shuffle is on. */
type Entry = { uid: string; track: PlayerTrack; rank: number };

type PlayerState = {
  /** Id of the track loaded in the player, playing or paused. */
  currentId?: string;
  playing: boolean;
  /**
   * Play a track. Passing `list` replaces the queue with that list (an album, say). Calling it for the
   * track that is already loaded pauses or resumes it instead.
   */
  play: (track: PlayerTrack, list?: PlayerTrack[]) => void;
  /** Add a track to the end of the queue. Starts nothing if something else is already playing. */
  enqueue: (track: PlayerTrack) => void;
  /** Id of the track that was just added to the queue, for a few seconds, so its row can show it. */
  justAddedId?: string;
};

const Ctx = createContext<PlayerState | null>(null);

/** The player, or null where there is none (the P1 editor canvas). */
export const usePlayerMaybe = () => useContext(Ctx);

export function usePlayer(): PlayerState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/** How long the "added to the queue" confirmation (the notice on the bar and the check on the row) stays up. */
const ADDED_NOTICE_MS = 2500;

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/**
 * Lives in the site layout so playback continues across navigation. No cookies, no storage,
 * no analytics: state is in memory only and disappears with the tab.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const counter = useRef(0);
  const [queue, setQueue] = useState<Entry[]>([]);
  const [currentUid, setCurrentUid] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [time, setTime] = useState({ elapsed: 0, duration: 0 });
  const [announcement, setAnnouncement] = useState("");
  const [added, setAdded] = useState<{ id: string; title: string }>();
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = queue.find((e) => e.uid === currentUid)?.track;
  const entry = useCallback((track: PlayerTrack): Entry => ({ uid: `q${++counter.current}`, track, rank: Math.random() }), []);

  /** Make an entry the loaded track. Playback only starts when asked to. */
  const load = useCallback((e: Entry, autoplay: boolean) => {
    setCurrentUid(e.uid);
    const el = audio.current;
    if (!el) return;
    el.src = e.track.src;
    if (autoplay) void el.play().catch(() => setPlaying(false));
  }, []);

  const togglePlayback = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, []);

  const play = useCallback(
    (track: PlayerTrack, list?: PlayerTrack[]) => {
      if (current?.id === track.id) {
        togglePlayback();
        return;
      }
      const made = (list ?? [track]).map(entry);
      const target = made.find((e) => e.track.id === track.id) ?? made[0];
      setQueue(shuffle ? rerank(made, target.uid) : made);
      load(target, true);
    },
    [current, entry, load, shuffle, togglePlayback],
  );

  const enqueue = useCallback(
    (track: PlayerTrack) => {
      // Queued behind the loaded track in shuffle order too, so it is still to come and not among those already played.
      const e = { ...entry(track), rank: rankAfter(queue.find((x) => x.uid === currentUid)?.rank) };
      setQueue((q) => [...q, e]);
      setAnnouncement(`Added ${track.title} to the queue`);
      // Sighted users get the same news as a notice on the bar and a check on the row. Adding again restarts the timer.
      setAdded({ id: track.id, title: track.title });
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(undefined), ADDED_NOTICE_MS);
      // With nothing loaded there is no player bar to hold the queue, so load it without playing.
      if (!current) load(e, false);
    },
    [current, currentUid, entry, load, queue],
  );

  const removeFromQueue = useCallback((uid: string) => {
    setQueue((q) => {
      const gone = q.find((e) => e.uid === uid);
      if (gone) setAnnouncement(`Removed ${gone.track.title} from the queue`);
      return q.filter((e) => e.uid !== uid);
    });
  }, []);

  /** Keep only the track that is loaded; everything queued around it goes. */
  const clearQueue = useCallback(() => {
    setQueue((q) => q.filter((e) => e.uid === currentUid));
    setAnnouncement("Queue cleared");
  }, [currentUid]);

  /** Previous and next follow the shuffled order when it is on. They wrap round whenever repeat is on. */
  const step = useCallback(
    (dir: 1 | -1) => {
      const next = neighbour(playOrder(queue, shuffle), currentUid, dir, repeat !== "off");
      if (next) load(next, true);
    },
    [queue, shuffle, repeat, currentUid, load],
  );

  /** A track ending: this track again, the next one, or (repeat off, last track) stop. */
  const ended = useCallback(() => {
    const el = audio.current;
    if (repeat === "one" && el) {
      el.currentTime = 0;
      void el.play().catch(() => setPlaying(false));
      return;
    }
    const next = neighbour(playOrder(queue, shuffle), currentUid, 1, repeat === "all");
    if (next) load(next, true);
  }, [queue, shuffle, repeat, currentUid, load]);

  const toggleShuffle = useCallback(() => {
    // Turning it on starts a new order from the track that is loaded, so none of the others are behind it.
    if (!shuffle) setQueue((q) => rerank(q, currentUid));
    setShuffle(!shuffle);
    setAnnouncement(shuffle ? "Shuffle off" : "Shuffle on");
  }, [shuffle, currentUid]);

  const cycleRepeat = useCallback(() => {
    const next = NEXT_REPEAT[repeat];
    setRepeat(next);
    setAnnouncement(repeatLabel(next));
  }, [repeat]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  // Hardware / lock-screen media keys.
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: "PARIS",
      album: current.album,
      artwork: [{ src: current.cover }],
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
  }, [current, step]);

  const value = useMemo(
    () => ({ currentId: current?.id, playing, play, enqueue, justAddedId: added?.id }),
    [current?.id, playing, play, enqueue, added?.id],
  );
  const progress = time.duration ? (time.elapsed / time.duration) * 100 : 0;

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* No crossOrigin attribute: playback and seeking work cross-origin without CORS, so new preview
          or production domains do not need to be added to the bucket's allowed origins. */}
      {/* Songs have no captions to provide; the lyrics page linked from each track is the text alternative. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime({ elapsed: e.currentTarget.currentTime, duration: e.currentTarget.duration })}
        onLoadedMetadata={(e) => setTime({ elapsed: 0, duration: e.currentTarget.duration })}
        onEnded={ended}
      />
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {current && (
        <div className="sticky bottom-0 z-40">
          <PlayerBar
            title={current.title}
            album={current.album}
            cover={current.cover}
            elapsed={fmt(time.elapsed)}
            duration={fmt(time.duration)}
            progress={Math.round(progress)}
            playing={playing}
            onToggle={togglePlayback}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            shuffle={shuffle}
            onShuffle={toggleShuffle}
            repeat={repeat}
            onRepeat={cycleRepeat}
            notice={added ? `Added ${added.title} to the queue` : undefined}
            queue={queue.map((e) => ({ id: e.uid, title: e.track.title, subtitle: e.track.album }))}
            currentId={currentUid}
            onSelect={(uid) => {
              const e = queue.find((x) => x.uid === uid);
              if (!e) return;
              // Jumping to a track while shuffled starts a new order from it.
              if (shuffle) setQueue(rerank(queue, uid));
              load(e, true);
            }}
            onRemove={removeFromQueue}
            onClear={clearQueue}
            onSeek={(pct) => {
              if (audio.current && Number.isFinite(audio.current.duration)) {
                audio.current.currentTime = (pct / 100) * audio.current.duration;
              }
            }}
          />
        </div>
      )}
    </Ctx.Provider>
  );
}
