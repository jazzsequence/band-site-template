import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Wordmark } from "./Wordmark";

const meta = { title: "Components/Wordmark", component: Wordmark } satisfies Meta<typeof Wordmark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Large: Story = { args: { size: "lg" } };
