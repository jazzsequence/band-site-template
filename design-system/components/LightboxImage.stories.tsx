import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LightboxImage } from "./LightboxImage";

const meta = {
  title: "Components/LightboxImage",
  component: LightboxImage,
  args: { src: "images/well-enough-cover.jpg", alt: "Well Enough cover art", className: "w-72 rounded-card border border-line" },
} satisfies Meta<typeof LightboxImage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the image, press Enter on it, or tab to it. Escape, the close button or the backdrop closes it. */
export const Cover: Story = {};
export const Wide: Story = { args: { src: "images/inside-cover.jpg", alt: "Inside cover artwork", className: "w-[36rem] max-w-full rounded-card border border-line" } };
