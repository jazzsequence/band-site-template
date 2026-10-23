import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TicketCard } from "./TicketCard";

const meta = {
  title: "Components/TicketCard",
  component: TicketCard,
  args: {
    order: "PRS-0097-4821",
    name: "Alex Rivera",
    quantity: 2,
    city: "San Francisco, CA",
    venue: "Roderick's Chamber",
    date: "Fri, Nov 14, 1997",
    doors: "9:00 PM",
  },
} satisfies Meta<typeof TicketCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
