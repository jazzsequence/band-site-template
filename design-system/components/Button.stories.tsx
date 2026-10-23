import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta = { title: "Components/Button", component: Button, args: { children: "Get tickets" } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Outline: Story = { args: { variant: "outline", children: "Listen" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Lyrics" } };
export const Disabled: Story = { args: { disabled: true, children: "Sold out" } };
