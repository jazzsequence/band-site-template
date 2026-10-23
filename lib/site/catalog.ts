import albumsData from "../../data/albums.json";
import { listAudioKeys } from "./audio";
import { getLyricSlugs } from "./lyrics";

export type Track = { number: number; slug: string; title: string };
export type GalleryImage = { src: string; alt: string; width: number; height: number };
export type Album = {
  slug: string;
  title: string;
  kind: string;
  /** Absent for unreleased material. */
  year?: number;
  cover: string;
  blurb: string;
  featured: boolean;
  /** Extra art shown under the track list (back cover, inner spread). */
  gallery?: GalleryImage[];
  tracks: Track[];
};

export const albums: Album[] = albumsData;

export const audioFile = (t: Track) => `${String(t.number).padStart(2, "0")}-${t.slug}.m4a`;
export const audioKey = (albumSlug: string, t: Track) => `${albumSlug}/${audioFile(t)}`;

export function audioUrl(albumSlug: string, t: Track): string {
  return `${process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? ""}/${audioKey(albumSlug, t)}`;
}

export const getAlbum = (slug: string) => albums.find((a) => a.slug === slug);
export const getFeaturedAlbum = () => albums.find((a) => a.featured) ?? albums[0];
export const albumTitle = (slug?: string) => albums.find((a) => a.slug === slug)?.title;

export type CatalogTrack = Track & {
  album: string;
  albumTitle: string;
  cover: string;
  /** Audio file exists in the bucket. Songs and lyrics are independent: a song may have neither. */
  hasAudio: boolean;
  hasLyrics: boolean;
  src: string;
  downloadHref: string;
};
export type CatalogAlbum = Omit<Album, "tracks"> & { tracks: CatalogTrack[] };

/** Albums with each track resolved against the bucket listing and the lyrics directory. */
export async function getCatalog(): Promise<CatalogAlbum[]> {
  const [keys, lyricSlugs] = await Promise.all([listAudioKeys(), getLyricSlugs()]);
  return albums.map((a) => ({
    ...a,
    tracks: a.tracks.map((t) => ({
      ...t,
      album: a.slug,
      albumTitle: a.title,
      cover: a.cover,
      hasAudio: keys.has(audioKey(a.slug, t)),
      hasLyrics: lyricSlugs.has(t.slug),
      src: audioUrl(a.slug, t),
      downloadHref: `/api/download/${a.slug}/${t.slug}`,
    })),
  }));
}
