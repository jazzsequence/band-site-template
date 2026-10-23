import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlayerBar, type RepeatMode } from "./PlayerBar";

const meta = {
  title: "Components/PlayerBar",
  component: PlayerBar,
  parameters: { layout: "fullscreen" },
  // On the site the bar is fixed to the bottom of the screen and the queue opens upward. Without a full-height frame it
  // would sit at the top of the canvas and the queue would open off the top of it.
  decorators: [
    (Story) => (
      <div className="flex min-h-screen flex-col justify-end">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Consent of the Quiet",
    album: "Well Enough",
    cover: "images/well-enough-cover.jpg",
    elapsed: "1:12",
    duration: "3:58",
    progress: 30,
    playing: true,
    // The site's player always has both, so every story shows them; ShuffleOn and the Repeat stories set the state.
    shuffle: false,
    onShuffle: () => {},
    repeat: "off",
    onRepeat: () => {},
  },
} satisfies Meta<typeof PlayerBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {};
export const Paused: Story = { args: { playing: false } };

const queue = [
  { id: "a", title: "Say when", subtitle: "Well Enough" },
  { id: "b", title: "Second Shift", subtitle: "Well Enough" },
  { id: "c", title: "Don’t ask what I am", subtitle: "Well Enough" },
];
export const WithQueue: Story = { args: { queue, currentId: "b", onRemove: () => {}, onClear: () => {} } };

// Shown for a few seconds after a track is added to the queue (the player owns the timer).
export const TrackAdded: Story = { args: { queue, currentId: "b", notice: "Added Don’t ask what I am to the queue" } };

// Each control only shows when its handler is given, so a bar without them still renders (the unit test pins that).
export const ShuffleOn: Story = { args: { queue, currentId: "b", shuffle: true } };
export const RepeatAll: Story = { args: { queue, currentId: "b", repeat: "all" } };
export const RepeatOne: Story = { args: { queue, currentId: "b", repeat: "one" } };

const NEXT: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

function InteractivePlayer(args: React.ComponentProps<typeof PlayerBar>) {
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  return <PlayerBar {...args} queue={queue} currentId="b" shuffle={shuffle} onShuffle={() => setShuffle((s) => !s)} repeat={repeat} onRepeat={() => setRepeat((r) => NEXT[r])} />;
}

/** Click the two buttons: shuffle toggles, repeat cycles off, all, this track. */
export const Interactive: Story = { render: (args) => <InteractivePlayer {...args} /> };
