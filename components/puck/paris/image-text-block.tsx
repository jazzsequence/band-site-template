import Markdown from "react-markdown";

import { ButtonLink } from "../../../design-system/components/Button";
import { LightboxImage } from "../../../design-system/components/LightboxImage";

type Props = {
  imageUrl?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  kicker?: string;
  title?: string;
  /** Make the title the page's h1. Exactly one block per page should; the rest stay h2. */
  titleLevel?: "h1" | "h2";
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/** A photo beside a block of text. Use it for the bio. Body accepts Markdown. */
export const imageTextBlock = {
  label: "Image and text",
  fields: {
    imageUrl: { type: "text" as const, label: "Image URL" },
    imageAlt: { type: "text" as const, label: "Image description (for screen readers)" },
    imageSide: {
      type: "radio" as const,
      label: "Image position",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    kicker: { type: "text" as const, label: "Small label above the title" },
    title: { type: "text" as const, label: "Title" },
    titleLevel: {
      type: "radio" as const,
      label: "Title is the page heading (h1)?",
      options: [
        { label: "No (h2)", value: "h2" },
        { label: "Yes (h1)", value: "h1" },
      ],
    },
    body: { type: "textarea" as const, label: "Text (Markdown)" },
    ctaLabel: { type: "text" as const, label: "Button label (optional)" },
    ctaHref: { type: "text" as const, label: "Button link" },
  },
  defaultProps: { imageUrl: "", imageAlt: "", imageSide: "left" as const, kicker: "", title: "", titleLevel: "h2" as const, body: "", ctaLabel: "", ctaHref: "" },
  render: ({ imageUrl, imageAlt, imageSide, kicker, title, titleLevel, body, ctaLabel, ctaHref }: Props) => {
    const Title = titleLevel === "h1" ? "h1" : "h2";
    return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className={`grid items-start gap-10 ${imageUrl ? "md:grid-cols-[22rem_1fr]" : ""}`}>
        {imageUrl ? (
          // The order class sits on this wrapper: inside the lightbox the image is no longer a grid child.
          <div className={imageSide === "right" ? "md:order-2" : ""}>
            <LightboxImage
              src={imageUrl}
              alt={imageAlt || title || "Photo"}
              loading="lazy"
              decoding="async"
              className="w-full rounded-card border border-line"
            />
          </div>
        ) : null}
        <div className="space-y-5">
          {kicker ? <p className="font-gothic text-3xl text-magenta">{kicker}</p> : null}
          {title ? (
            <Title className="text-chrome font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.04em] md:text-6xl">
              {title}
            </Title>
          ) : null}
          {body ? (
            <div className="space-y-4 text-lg leading-8 text-muted [&_a]:text-cyan [&_a]:underline [&_a]:underline-offset-4">
              <Markdown>{body}</Markdown>
            </div>
          ) : null}
          {ctaLabel && ctaHref ? <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink> : null}
        </div>
      </div>
    </div>
    );
  },
};
