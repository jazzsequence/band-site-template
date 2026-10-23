import { ButtonLink } from "./Button";

export type TourDateRowProps = {
  month: string; // "NOV"
  day: string; // "14"
  year: number;
  city: string;
  venue: string;
  capacity?: string;
  status?: "on-sale" | "sold-out";
  href?: string;
  /** Heading level for the title; use "h2" when the card sits directly under the page h1. */
  headingLevel?: "h2" | "h3";
};

export function TourDateRow({ month, day, year, city, venue, capacity, status = "on-sale", href = "#", headingLevel: Heading = "h3" }: TourDateRowProps) {
  return (
    <li className="grid grid-cols-[4.5rem_1fr] items-center gap-x-5 gap-y-3 border-b border-line py-5 md:grid-cols-[5rem_1fr_auto]">
      <time dateTime={`${year}-${month}-${day}`} className="text-center leading-none">
        <span className="block font-display text-xs uppercase tracking-[0.25em] text-magenta">{month}</span>
        <span className="text-chrome block font-display text-4xl font-bold">{day}</span>
        <span className="block text-xs text-muted">{year}</span>
      </time>
      <div>
        <Heading className="font-display text-xl font-semibold uppercase tracking-wide">{city}</Heading>
        <p className="text-muted">
          {venue}
          {capacity && <span className="text-dim"> · cap. {capacity}</span>}
        </p>
      </div>
      <div className="col-span-2 md:col-span-1">
        {status === "sold-out" ? (
          <span className="inline-block border border-dim px-6 py-3 font-display text-xs uppercase tracking-[0.18em] text-muted">
            Sold out
          </span>
        ) : (
          <ButtonLink href={href}>Get tickets</ButtonLink>
        )}
      </div>
    </li>
  );
}
