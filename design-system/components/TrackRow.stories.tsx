import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TrackRow } from "./TrackRow";

const meta = {
  title: "Components/TrackRow",
  component: TrackRow,
  // The site's rows always have the queue button, so every story shows it (it is hidden only when there is no audio).
  args: { number: 7, title: "Consent of the Quiet", duration: "3:58", lyricsHref: "#", onQueue: () => {} },
  decorators: [(Story) => <ul className="w-[36rem] max-w-full"><Story /></ul>],
} satisfies Meta<typeof TrackRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Playing: Story = { args: { current: true, playing: true } };
export const Paused: Story = { args: { current: true, playing: false } };
// The check the queue button shows for a moment after the track is added (the player owns the timer).
export const JustQueued: Story = { args: { justQueued: true } };
export const NoAudioYet: Story = { args: { hasAudio: false, number: 3, title: "Seniority" } };
