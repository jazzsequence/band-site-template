import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LyricsBlock } from "./LyricsBlock";

const meta = { title: "Components/LyricsBlock", component: LyricsBlock } satisfies Meta<typeof LyricsBlock>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    title: "Consent of the Quiet",
    album: "Well Enough",
    sections: [
      { label: "Pre-Chorus", lines: ["Don’t scream", "They love you better when you don’t scream"] },
      { label: "Chorus", lines: ["You didn’t rule us", "We let you", "You didn’t own us", "We bent"] },
    ],
  },
};
