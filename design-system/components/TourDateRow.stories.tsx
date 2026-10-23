import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TourDateRow } from "./TourDateRow";

const meta = {
  title: "Components/TourDateRow",
  component: TourDateRow,
  args: { month: "MAR", day: "12", year: 2027, city: "Sample City, CA", venue: "Example Hall", capacity: "350" },
  decorators: [(Story) => <ul className="w-[44rem] max-w-full"><Story /></ul>],
} satisfies Meta<typeof TourDateRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnSale: Story = {};
export const SoldOut: Story = { args: { status: "sold-out", day: "14", city: "Sample Town, OR", venue: "Placeholder Theatre", capacity: "400" } };
