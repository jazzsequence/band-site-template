import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionHeading } from "./SectionHeading";

const meta = { title: "Components/SectionHeading", component: SectionHeading } satisfies Meta<typeof SectionHeading>;
export default meta;
export const Default: StoryObj<typeof meta> = { args: { kicker: "On the road", children: "Tour" } };
