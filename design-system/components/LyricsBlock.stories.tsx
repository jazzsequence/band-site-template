import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LyricsBlock } from "./LyricsBlock";

const meta = { title: "Components/LyricsBlock", component: LyricsBlock } satisfies Meta<typeof LyricsBlock>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    title: "First Song",
    album: "Debut Album",
    sections: [
      { label: "Verse 1", lines: ["Placeholder line one", "Placeholder line two"] },
      { label: "Chorus", lines: ["Placeholder chorus line one", "Placeholder chorus line two"] },
    ],
  },
};
