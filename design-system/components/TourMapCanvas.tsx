"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

import type { MapPoint } from "./TourMap";

const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * The map itself. Kept in its own module so MapLibre and its tile requests only exist once a visitor has
 * clicked "Show map" (see TourMap). Tiles come from OpenStreetMap, so this component is the only place on
 * the site that sends a visitor's IP address to a third party.
 */
export default function TourMapCanvas({ points, workerUrl }: { points: MapPoint[]; workerUrl: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el || points.length === 0) return;
    // A relative URL (Storybook) resolves against the page, an absolute path (the site) against its root.
    maplibregl.setWorkerUrl(new URL(workerUrl, document.baseURI).href);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: OSM_ATTRIBUTION,
          },
        },
        // Dimmed and desaturated so the light tiles sit on the dark site instead of glaring.
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: { "raster-brightness-max": 0.5, "raster-saturation": -0.55, "raster-contrast": 0.15 },
          },
        ],
      },
      center: [points[0].lon, points[0].lat],
      zoom: 15,
      // Scrolling the page must not get trapped by the map: zooming needs ctrl (or two fingers on touch).
      cooperativeGestures: true,
      fadeDuration: reduceMotion ? 0 : 300,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    for (const p of points) {
      const pin = document.createElement("div");
      pin.setAttribute("role", "img");
      pin.setAttribute("aria-label", p.label);
      Object.assign(pin.style, {
        width: "18px",
        height: "18px",
        borderRadius: "9999px",
        background: "var(--color-magenta)",
        border: "2px solid var(--color-void)",
        boxShadow: "0 0 12px var(--color-magenta)",
      });
      const popup = new maplibregl.Popup({ offset: 14, closeButton: true }).setDOMContent(popupContent(p));
      new maplibregl.Marker({ element: pin }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map);
    }

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const p of points) bounds.extend([p.lon, p.lat]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 7, duration: 0 });
    }

    return () => map.remove();
  }, [points, workerUrl]);

  return <div ref={container} className="size-full" />;
}

/** Built with textContent, never innerHTML: labels come from content that editors can change. */
function popupContent(p: MapPoint): HTMLElement {
  const box = document.createElement("div");
  box.style.color = "var(--color-void)";
  const name = document.createElement("strong");
  name.textContent = p.label;
  box.append(name);
  if (p.detail) {
    const d = document.createElement("div");
    d.textContent = p.detail;
    box.append(d);
  }
  if (p.href) {
    const a = document.createElement("a");
    a.href = p.href;
    a.textContent = "Show details";
    a.style.textDecoration = "underline";
    box.append(document.createElement("br"), a);
  }
  return box;
}
