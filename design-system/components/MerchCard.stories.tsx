import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchCard } from "./MerchCard";

const meta = {
  title: "Components/MerchCard",
  component: MerchCard,
  args: { name: "Placeholder tee", price: "$25", image: "images/placeholder-merch.png" },
  decorators: [(Story) => <div className="w-64"><Story /></div>],
} satisfies Meta<typeof MerchCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
