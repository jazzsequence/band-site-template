import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AlbumCard } from "./AlbumCard";

const meta = {
  title: "Components/AlbumCard",
  component: AlbumCard,
  args: { title: "Well Enough", year: 1997, cover: "images/well-enough-cover.jpg", trackCount: 13 },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
} satisfies Meta<typeof AlbumCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Featured: Story = { args: { featured: true } };
export const Standard: Story = { args: { title: "Tribute", cover: "images/tribute-cover.jpg", trackCount: 7 } };
