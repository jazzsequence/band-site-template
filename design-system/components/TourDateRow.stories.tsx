import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TourDateRow } from "./TourDateRow";

const meta = {
  title: "Components/TourDateRow",
  component: TourDateRow,
  args: { month: "NOV", day: "14", year: 1997, city: "San Francisco, CA", venue: "Roderick's Chamber", capacity: "350" },
  decorators: [(Story) => <ul className="w-[44rem] max-w-full"><Story /></ul>],
} satisfies Meta<typeof TourDateRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnSale: Story = {};
export const SoldOut: Story = { args: { status: "sold-out", day: "21", city: "Oakland, CA", venue: "Paramount Theatre", capacity: "3000" } };
