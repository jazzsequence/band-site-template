/**
 * MapLibre GL 6 ships its web worker as two separate files (the worker and a shared sibling it imports by
 * relative path), and no bundler used here emits them. They are copied into public/maplibre/ so the map can
 * load a same-origin worker (no blob: in the Content Security Policy). Run before dev, build and Storybook;
 * the copies are gitignored, so upgrading maplibre-gl needs no manual step.
 * See https://github.com/maplibre/maplibre-gl-js/blob/main/docs/index.md (Turbopack, Vite).
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const dist = path.join(path.dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")), "dist");
const dest = path.join(process.cwd(), "public", "maplibre");

mkdirSync(dest, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(path.join(dist, file), path.join(dest, file));
