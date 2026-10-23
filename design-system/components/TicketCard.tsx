import { QRCodeSVG } from "qrcode.react";

import { band } from "../../lib/band/config";
import { Wordmark } from "./Wordmark";

const TICKET_PREFIX = band.name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "BAND";

export type TicketCardProps = {
  order: string;
  name: string;
  quantity: number;
  city: string;
  venue: string;
  date: string;
  doors: string;
};

/** The one place suspension of disbelief is allowed: a purchase confirmation with a QR code. */
export function TicketCard({ order, name, quantity, city, venue, date, doors }: TicketCardProps) {
  return (
    <article
      aria-label="E-ticket"
      className="grid max-w-3xl grid-cols-1 overflow-hidden rounded-card border border-line bg-raised md:grid-cols-[1fr_14rem]"
    >
      <div className="relative space-y-4 p-6 md:p-8">
        <span className="absolute inset-x-0 top-0 h-1 bg-[image:var(--grad-accent)]" aria-hidden />
        <Wordmark />
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-[-0.03em]">{venue}</h2>
          <p className="text-muted">{city}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-dim uppercase tracking-widest text-xs">Date</dt><dd>{date}</dd></div>
          <div><dt className="text-dim uppercase tracking-widest text-xs">Doors</dt><dd>{doors}</dd></div>
          <div><dt className="text-dim uppercase tracking-widest text-xs">Name</dt><dd>{name}</dd></div>
          <div><dt className="text-dim uppercase tracking-widest text-xs">Admit</dt><dd>{quantity}</dd></div>
        </dl>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-line bg-metal-hi p-6 text-void md:border-l md:border-t-0">
        {/* Generated client-side from the order number; nothing is stored or sent anywhere. Drawn in the panel's own
            colours (currentColor on its background) because SVG attributes cannot read CSS variables. */}
        <QRCodeSVG
          value={`${TICKET_PREFIX}-TICKET:${order}`}
          size={144}
          level="M"
          marginSize={0}
          bgColor="transparent"
          fgColor="currentColor"
          title={`Ticket QR code for order ${order}`}
        />
        <p className="font-display text-xs tracking-[0.2em]">{order}</p>
      </div>
    </article>
  );
}
