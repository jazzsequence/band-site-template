import { LightboxImage } from "./LightboxImage";

export function MerchCard({
  name,
  price,
  image,
  headingLevel: Heading = "h3",
}: {
  name: string;
  price: string;
  image: string;
  /** Use "h2" when the card sits directly under the page h1. */
  headingLevel?: "h2" | "h3";
}) {
  return (
    <div className="group space-y-3">
      <div className="aspect-square overflow-hidden rounded-card border border-line bg-surface">
        <LightboxImage src={image} alt={name} width={640} height={640} loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <Heading className="font-display text-sm font-semibold uppercase tracking-wide">{name}</Heading>
        <p className="tabular-nums text-cyan">{price}</p>
      </div>
    </div>
  );
}
