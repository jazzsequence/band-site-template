import { createMediaFigureBlock } from "@pantheon-systems/p1-media/server";
import { blockPaddingClass } from "./block-padding";

// CDN origin, not the Worker API URL; defaults to production when unset.
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

/** @deprecated Install `@p1/figure` from the P1 component library instead. Kept so existing pages still render. */
export const mediaFigureBlock = createMediaFigureBlock({
  mediaBaseUrl: MEDIA_BASE,
  transform: { width: 1200, height: 630, format: "webp" },
  className: `m-0 ${blockPaddingClass} [&>img]:block [&>img]:h-auto [&>img]:max-h-[400px] [&>img]:w-full [&>img]:max-w-4xl [&>img]:rounded-lg [&>img]:object-contain`,
  captionClassName: "mt-3 max-w-4xl text-sm text-neutral-600",
});
