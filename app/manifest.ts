import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PARIS",
    short_name: "PARIS",
    description: "PARIS: tour dates, music, lyrics and the new album Well Enough.",
    start_url: "/",
    display: "browser",
    background_color: "#07050d",
    theme_color: "#07050d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
