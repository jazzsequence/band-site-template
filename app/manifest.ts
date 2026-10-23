import type { MetadataRoute } from "next";

import { band } from "../lib/band/config";
import { palette } from "../lib/theme/site-palette";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: band.name,
    short_name: band.name,
    description: band.description,
    start_url: "/",
    display: "browser",
    background_color: palette.void,
    theme_color: palette.void,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
