import tourData from "../../data/tour.json";
import type { MapPoint } from "../../design-system/components/TourMap";

export type Show = {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  city: string;
  venue: string;
  address?: string;
  capacity?: string;
  doors: string;
  price: number;
  status: "on-sale" | "sold-out";
  lat: number;
  lon: number;
};

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Stable id used in the ticket URL. An explicit id wins, so existing links keep working; new dates derive one. */
export const showId = (s: Pick<Show, "city" | "date"> & { id?: string }) =>
  s.id?.trim() || `${slug(s.city.split(",")[0] ?? s.city)}-${s.date}`;

/** Cleans untrusted editor input (P1 block props) into complete, date-sorted shows. Invalid rows are dropped. */
export function normalizeShows(items: unknown): Show[] {
  if (!Array.isArray(items)) return [];
  const rows: Show[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const date = typeof r.date === "string" ? r.date.trim() : "";
    const city = typeof r.city === "string" ? r.city.trim() : "";
    const venue = typeof r.venue === "string" ? r.venue.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !city || !venue) continue;
    const price = Number(r.price);
    rows.push({
      id: showId({ id: typeof r.id === "string" ? r.id : undefined, city, date }),
      date,
      city,
      venue,
      ...(typeof r.address === "string" && r.address.trim() ? { address: r.address.trim() } : {}),
      ...(typeof r.capacity === "string" && r.capacity.trim() ? { capacity: r.capacity.trim() } : {}),
      doors: typeof r.doors === "string" && r.doors.trim() ? r.doors.trim() : "TBA",
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      status: r.status === "sold-out" ? "sold-out" : "on-sale",
      lat: Number.isFinite(Number(r.lat)) ? Number(r.lat) : 0,
      lon: Number.isFinite(Number(r.lon)) ? Number(r.lon) : 0,
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/** Pins for the tour map. A show with no coordinates (stored as 0 when missing) is left off rather than put in the Atlantic. */
export function mapPoints(list: Show[], link = false): MapPoint[] {
  return list
    .filter((s) => s.lat !== 0 || s.lon !== 0)
    .map((s) => ({
      id: s.id,
      label: s.venue,
      detail: s.address ? `${s.address}, ${s.city}` : s.city,
      lat: s.lat,
      lon: s.lon,
      ...(link ? { href: `/tickets/${s.id}` } : {}),
    }));
}

/** Repo copy of the tour: used when P1 is unreachable, and as the seed for the P1 page. */
export const shows = normalizeShows(tourData);
export const getShow = (id: string) => shows.find((s) => s.id === id);

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Parses the ISO string by hand: `new Date("1997-10-07")` is UTC and shifts a day in US timezones. */
const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
};

export const dateParts = (iso: string) => {
  const p = parts(iso);
  return { month: MONTHS[p.month], day: String(p.day), year: p.year };
};

export const longDate = (iso: string) => {
  const p = parts(iso);
  return `${DAYS[p.weekday]}, ${LONG_MONTHS[p.month]} ${p.day}, ${p.year}`;
};

export const money = (n: number) => `$${n.toFixed(2)}`;
