import { SectionHeading } from "../../../design-system/components/SectionHeading";

type Props = { kicker?: string; title?: string; intro?: string };

/** The page title. Every page needs exactly one, so this is the h1. */
export const pageHeadingBlock = {
  label: "Page heading",
  fields: {
    kicker: { type: "text" as const, label: "Small label above the title" },
    title: { type: "text" as const, label: "Title" },
    intro: { type: "textarea" as const, label: "Intro (optional)" },
  },
  defaultProps: { kicker: "", title: "Page title", intro: "" },
  render: ({ kicker, title, intro }: Props) => (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-6 pt-14">
      <SectionHeading as="h1" kicker={kicker || undefined}>
        {title || "Page title"}
      </SectionHeading>
      {intro ? <p className="max-w-xl text-lg text-muted">{intro}</p> : null}
    </div>
  ),
};
