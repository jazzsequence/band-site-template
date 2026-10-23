import Markdown from "react-markdown";

import { ButtonLink } from "../../../design-system/components/Button";
import { Hero, type HeroAction } from "../../../design-system/components/Hero";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { SectionHeading } from "../../../design-system/components/SectionHeading";

type ActionItem = { label?: string; href?: string; style?: "primary" | "outline" };

const actionFields = {
  actions: {
    type: "array" as const,
    label: "Buttons",
    arrayFields: {
      label: { type: "text" as const, label: "Label" },
      href: { type: "text" as const, label: "Link (e.g. /tour)" },
      style: {
        type: "radio" as const,
        label: "Style",
        options: [
          { label: "Solid", value: "primary" },
          { label: "Outline", value: "outline" },
        ],
      },
    },
    defaultItemProps: { label: "Button", href: "/", style: "primary" },
    getItemSummary: (i: ActionItem) => i.label || "Button",
  },
};

export const toActions = (items?: ActionItem[]): HeroAction[] =>
  (items ?? []).filter((a) => a.label && a.href).map((a) => ({ label: a.label ?? "", href: a.href ?? "/", variant: a.style ?? "primary" }));

/** The full-width photo banner at the top of a page. It carries the page's h1, so use one per page. */
export const heroBlock = {
  label: "Hero",
  fields: {
    imageUrl: { type: "text" as const, label: "Photo URL" },
    kicker: { type: "text" as const, label: "Small label above the title" },
    title: { type: "text" as const, label: "Title (this is the page's h1)" },
    blurb: { type: "textarea" as const, label: "Text under the title" },
    ...actionFields,
  },
  defaultProps: {
    imageUrl: "/images/paris-on-stage.jpg",
    kicker: "",
    title: "Title",
    blurb: "",
    actions: [
      { label: "Tour dates", href: "/tour", style: "primary" },
      { label: "Listen", href: "/listen", style: "outline" },
    ],
  },
  render: ({ imageUrl, kicker, title, blurb, actions }: { imageUrl?: string; kicker?: string; title?: string; blurb?: string; actions?: ActionItem[] }) => (
    <Hero image={imageUrl ?? ""} kicker={kicker ?? ""} title={title ?? ""} blurb={blurb ?? ""} actions={toActions(actions)} />
  ),
};

/** A section title (h2) in the site's display style. For the page title use Page heading or Hero. */
export const sectionHeadingBlock = {
  label: "Section heading",
  fields: {
    kicker: { type: "text" as const, label: "Small label above the title" },
    title: { type: "text" as const, label: "Title" },
  },
  defaultProps: { kicker: "", title: "Section" },
  render: ({ kicker, title }: { kicker?: string; title?: string }) => (
    <div className="mx-auto w-full max-w-6xl px-6 pt-10">
      <SectionHeading kicker={kicker || undefined}>{title || "Section"}</SectionHeading>
    </div>
  ),
};

/**
 * Long text in Markdown: an interview, a policy. Use `# Title` once for the page's h1 and `## Heading` for
 * sections. Links, lists, quotes and emphasis all work.
 */
export const articleBlock = {
  label: "Article",
  fields: {
    kicker: { type: "text" as const, label: "Small label above the text (optional)" },
    markdown: { type: "textarea" as const, label: "Text (Markdown)" },
  },
  defaultProps: { kicker: "", markdown: "# Title\n\nWrite here." },
  render: ({ kicker, markdown }: { kicker?: string; markdown?: string }) => (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      {kicker ? <p className="mb-2 font-gothic text-2xl text-magenta">{kicker}</p> : null}
      <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-[-0.03em] prose-h1:text-4xl prose-h2:text-2xl prose-h2:text-text prose-p:text-muted prose-strong:text-text prose-a:text-cyan">
        <Markdown>{markdown ?? ""}</Markdown>
      </article>
    </div>
  ),
};

type GalleryItem = { imageUrl?: string; alt?: string };

/** Pictures in a grid; each opens larger in the lightbox. */
export const imageGalleryBlock = {
  label: "Image gallery",
  fields: {
    columns: {
      type: "radio" as const,
      label: "Columns",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
      ],
    },
    items: {
      type: "array" as const,
      label: "Pictures",
      arrayFields: {
        imageUrl: { type: "text" as const, label: "Image URL" },
        alt: { type: "text" as const, label: "Description (for screen readers)" },
      },
      defaultItemProps: { imageUrl: "", alt: "" },
      getItemSummary: (i: GalleryItem) => i.alt || i.imageUrl || "Picture",
    },
  },
  defaultProps: { columns: "2", items: [] as GalleryItem[] },
  render: ({ columns, items }: { columns?: string; items?: GalleryItem[] }) => (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className={`grid gap-6 sm:grid-cols-2 ${columns === "3" ? "md:grid-cols-3" : ""}`}>
        {(items ?? [])
          .filter((i) => i.imageUrl)
          .map((i) => (
            <LightboxImage
              key={i.imageUrl}
              src={i.imageUrl ?? ""}
              alt={i.alt || "Picture"}
              loading="lazy"
              decoding="async"
              className="w-full rounded-card border border-line"
            />
          ))}
      </div>
    </div>
  ),
};

/** A row of one or two buttons. */
export const buttonRowBlock = {
  label: "Buttons",
  fields: actionFields,
  defaultProps: { actions: [{ label: "Tour dates", href: "/tour", style: "primary" }] },
  render: ({ actions }: { actions?: ActionItem[] }) => (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-3 px-6 py-6">
      {toActions(actions).map((a) => (
        <ButtonLink key={`${a.label}-${a.href}`} href={a.href} variant={a.variant ?? "primary"}>
          {a.label}
        </ButtonLink>
      ))}
    </div>
  ),
};
