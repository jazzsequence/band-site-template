import { assetUrl } from "../asset";
import { ButtonLink } from "./Button";

export type HeroAction = { label: string; href: string; variant?: "primary" | "outline" };

const DEFAULT_ACTIONS: HeroAction[] = [
  { label: "Tour dates", href: "/tour" },
  { label: "Listen", href: "/listen", variant: "outline" },
];

export function Hero({
  image,
  kicker,
  title,
  blurb,
  actions = DEFAULT_ACTIONS,
}: {
  image: string;
  kicker: string;
  title: string;
  blurb: string;
  /** Buttons under the blurb. Defaults to Tour dates and Listen. */
  actions?: HeroAction[];
}) {
  return (
    // The photo is cropped to a landscape frame (object-cover), so a portrait shows only a slice. Height follows
    // width (56vw) so the subject stays in frame on wide monitors, and the fade is limited to the bottom third so
    // it never reaches the subject. A separate left shade keeps the title readable over the photo.
    <section className="relative isolate grid min-h-[max(80vh,56vw)] items-end overflow-hidden">
      <img src={assetUrl(image)} alt="" width={1600} height={900} fetchPriority="high" decoding="async" className="absolute inset-0 -z-20 size-full object-cover object-[50%_6%]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/70 via-[14%] to-transparent to-[34%]" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-void/95 via-void/75 via-[45%] to-transparent to-[78%] max-lg:hidden" aria-hidden />
      {/* The text sits on a dark, lightly blurred card, so its contrast does not depend on which part of the photo
          ends up behind it (a photo can have bright stage lights). From lg up the left-hand shade does the same
          job and the card disappears; the text is then sized to stay on the left, clear of a subject in the middle
          of the frame at those widths (e2e/hero-contrast.spec.ts checks this against the real photo). */}
      <div className="mx-4 mb-6 max-w-3xl space-y-5 rounded-card bg-void/85 p-5 backdrop-blur-sm md:mx-8 md:mb-10 md:w-fit md:p-8 lg:mx-0 lg:mb-0 lg:w-auto lg:max-w-[26rem] lg:rounded-none lg:bg-transparent lg:p-0 lg:px-12 lg:pb-16 lg:backdrop-blur-none xl:max-w-[30rem] 2xl:max-w-3xl">
        <p className="font-gothic text-3xl text-accent">{kicker}</p>
        <h1 className="text-metal font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-8xl lg:text-6xl xl:text-7xl 2xl:text-8xl">{title}</h1>
        <p className="max-w-xl text-lg text-text">{blurb}</p>
        <div className="flex flex-wrap gap-3">
          {actions.map((a) => (
            <ButtonLink key={`${a.label}-${a.href}`} href={a.href} variant={a.variant ?? "primary"}>
              {a.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </section>
  );
}
