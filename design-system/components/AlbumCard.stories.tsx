import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AlbumCard } from "./AlbumCard";

const meta = {
  title: "Components/AlbumCard",
  component: AlbumCard,
  args: { title: "Debut Album", year: 2026, cover: "images/placeholder-cover.png", trackCount: 3 },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
} satisfies Meta<typeof AlbumCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Featured: Story = { args: { featured: true } };
export const Standard: Story = { args: { title: "First EP", cover: "images/placeholder-cover.png", trackCount: 2 } };
