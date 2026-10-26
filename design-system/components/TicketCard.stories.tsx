import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TicketCard } from "./TicketCard";

const meta = {
  title: "Components/TicketCard",
  component: TicketCard,
  args: {
    order: "BAND-0001-4821",
    name: "Sample Fan",
    quantity: 2,
    city: "Sample City, CA",
    venue: "Example Hall",
    date: "Fri, Mar 12, 2027",
    doors: "8:00 PM",
  },
} satisfies Meta<typeof TicketCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
