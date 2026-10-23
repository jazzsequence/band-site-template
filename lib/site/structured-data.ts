import type { CatalogAlbum } from "./catalog";
import { absoluteUrl, artistNode, SITE_URL } from "./seo";
import type { Show } from "./tour";

const RELEASE_TYPE: Record<string, string> = { LP: "AlbumRelease", EP: "EPRelease", "B-sides": "AlbumRelease" };

export function albumData(album: CatalogAlbum, pagePath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": absoluteUrl(pagePath),
    url: absoluteUrl(pagePath),
    name: album.title,
    image: absoluteUrl(album.cover),
    description: album.blurb,
    byArtist: artistNode,
    ...(album.year ? { datePublished: String(album.year), albumReleaseType: RELEASE_TYPE[album.kind] ?? "AlbumRelease" } : {}),
    numTracks: album.tracks.length,
    track: album.tracks.map((t) => ({
      "@type": "MusicRecording",
      position: t.number,
      name: t.title,
      byArtist: artistNode,
      ...(t.hasLyrics ? { url: absoluteUrl(`/lyrics/${t.slug}`) } : {}),
    })),
  };
}

export function artistData() {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${SITE_URL}/#artist`,
    name: "PARIS",
    url: SITE_URL,
    image: absoluteUrl("/images/paris-portrait.jpg"),
    genre: "Industrial pop",
  };
}

export function eventData(show: Show) {
  const [locality, region] = show.city.split(", ");
  return {
    "@type": "MusicEvent",
    name: `PARIS at ${show.venue}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    performer: artistNode,
    location: {
      "@type": "MusicVenue",
      name: show.venue,
      address: { "@type": "PostalAddress", ...(show.address ? { streetAddress: show.address } : {}), addressLocality: locality, addressRegion: region, addressCountry: "US" },
      geo: { "@type": "GeoCoordinates", latitude: show.lat, longitude: show.lon },
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/tickets/${show.id}`),
      price: show.price.toFixed(2),
      priceCurrency: "USD",
      availability: show.status === "sold-out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };
}
