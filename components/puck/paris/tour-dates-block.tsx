import { TourDateRow } from "../../../design-system/components/TourDateRow";
import { TourMap } from "../../../design-system/components/TourMap";
import { dateParts, mapPoints, normalizeShows, showId } from "../../../lib/site/tour";

/** The tour. Each date is an item; the ticket page for a date is generated from it. */
export const tourDatesBlock = {
  label: "Tour dates",
  fields: {
    items: {
      type: "array" as const,
      label: "Shows",
      arrayFields: {
        id: { type: "text" as const, label: "URL id (optional, set once, never change)" },
        date: { type: "text" as const, label: "Date (YYYY-MM-DD)" },
        city: { type: "text" as const, label: "City, state (e.g. Denver, CO)" },
        venue: { type: "text" as const, label: "Venue" },
        address: { type: "text" as const, label: "Street address" },
        capacity: { type: "text" as const, label: "Capacity (optional)" },
        doors: { type: "text" as const, label: "Doors (e.g. 8:00 PM)" },
        price: { type: "number" as const, label: "Ticket price (USD)" },
        status: {
          type: "radio" as const,
          label: "Status",
          options: [
            { label: "On sale", value: "on-sale" },
            { label: "Sold out", value: "sold-out" },
          ],
        },
        lat: { type: "number" as const, label: "Latitude" },
        lon: { type: "number" as const, label: "Longitude" },
      },
      defaultItemProps: {
        id: "",
        date: "1997-01-01",
        city: "City, ST",
        venue: "Venue",
        address: "",
        capacity: "",
        doors: "8:00 PM",
        price: 15,
        status: "on-sale",
        lat: 0,
        lon: 0,
      },
      getItemSummary: (item: { date?: string; city?: string }) => `${item.date ?? ""} ${item.city ?? ""}`.trim() || "Show",
    },
  },
  defaultProps: { items: [] as Record<string, unknown>[] },
  render: ({ items }: { items?: unknown }) => {
    const shows = normalizeShows(items);
    const points = mapPoints(shows, true);
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        {shows.length === 0 ? (
          <p className="border border-line bg-surface px-6 py-5 text-muted">No dates announced yet.</p>
        ) : (
          <ul>
            {shows.map((s) => (
              <TourDateRow
                key={showId(s)}
                {...dateParts(s.date)}
                city={s.city}
                venue={s.venue}
                capacity={s.capacity}
                status={s.status}
                href={`/tickets/${showId(s)}`}
                headingLevel="h2"
              />
            ))}
          </ul>
        )}
        {points.length > 0 && <TourMap points={points} label="Tour map" className="mt-8" />}
      </div>
    );
  },
};
