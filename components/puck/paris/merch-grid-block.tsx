import { MerchCard } from "../../../design-system/components/MerchCard";

type Item = { name?: string; price?: string; imageUrl?: string };

/** Merchandise shown as a grid. There is no checkout: everything is sold at the merch table on tour. */
export const merchGridBlock = {
  label: "Merch grid",
  fields: {
    items: {
      type: "array" as const,
      label: "Items",
      arrayFields: {
        name: { type: "text" as const, label: "Name" },
        price: { type: "text" as const, label: "Price (e.g. $24)" },
        imageUrl: { type: "text" as const, label: "Image URL" },
      },
      defaultItemProps: { name: "New item", price: "$0", imageUrl: "" },
      getItemSummary: (item: Item) => item.name || "Item",
    },
  },
  defaultProps: { items: [] as Item[] },
  render: ({ items }: { items?: Item[] }) => (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {(items ?? [])
          .filter((i) => i.name)
          .map((i) => (
            <MerchCard key={`${i.name}-${i.imageUrl}`} name={i.name ?? ""} price={i.price ?? ""} image={i.imageUrl ?? ""} headingLevel="h2" />
          ))}
      </div>
    </div>
  ),
};
