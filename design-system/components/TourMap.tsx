"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { Button } from "./Button";

export type MapPoint = {
  id: string;
  label: string;
  /** Street address or city, shown in the list and the pin's popup. */
  detail?: string;
  lat: number;
  lon: number;
  /** Where the popup's "Show details" link goes. */
  href?: string;
};

// MapLibre is large, and loading the map contacts OpenStreetMap. Neither happens until the visitor asks.
const Canvas = lazy(() => import("./TourMapCanvas"));

/**
 * Where a show (or every show) is. It starts as plain text: the places and their addresses. The interactive map
 * loads on request, so by default no map tiles are fetched and nothing about the visitor leaves the site. Say that wherever the map is used and keep the Privacy page in step.
 */
export function TourMap({
  points,
  label,
  className = "",
  workerUrl = "/maplibre/maplibre-gl-worker.mjs",
}: {
  points: MapPoint[];
  label: string;
  className?: string;
  /** Where public/maplibre/maplibre-gl-worker.mjs is served. Storybook passes a relative path, like its images. */
  workerUrl?: string;
}) {
  const [shown, setShown] = useState(false);
  const region = useRef<HTMLDivElement>(null);

  // The button that was clicked is gone once the map appears, so keyboard focus moves to the map.
  useEffect(() => {
    if (shown) region.current?.focus();
  }, [shown]);

  return (
    <section aria-label={label} className={`space-y-4 rounded-card border border-line bg-surface p-5 ${className}`}>
      <ul className="space-y-2 text-sm">
        {points.map((p) => (
          <li key={p.id}>
            <span className="font-semibold text-text">{p.label}</span>
            {p.detail ? <span className="text-muted"> · {p.detail}</span> : null}
          </li>
        ))}
      </ul>
      {shown ? (
        <div ref={region} tabIndex={-1} role="region" aria-label={`Map: ${label}`} className="h-80 overflow-hidden rounded-card border border-line focus-visible:outline-2 focus-visible:outline-cyan sm:h-96">
          <Suspense fallback={<p className="p-4 text-sm text-muted">Loading map…</p>}>
            <Canvas points={points} workerUrl={workerUrl} />
          </Suspense>
        </div>
      ) : (
        <div className="space-y-3">
          <Button type="button" variant="outline" onClick={() => setShown(true)}>
            Show map
          </Button>
          <p className="text-xs text-dim">
            Showing the map loads tiles from OpenStreetMap, which will see your IP address. Until you do, nothing is requested.
          </p>
        </div>
      )}
    </section>
  );
}
