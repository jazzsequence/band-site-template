import type { Preview } from "@storybook/nextjs-vite";
import { themes } from "storybook/theming";

import "../design-system/fonts";
import "../design-system/ds.css";
import "../design-system/base.css";

// The site is dark only. Without a wrapper, Storybook's own canvas and docs pages are white
// and the light-on-dark tokens become unreadable, so every story renders on the site surface.
const preview: Preview = {
  decorators: [
    (Story, { parameters }) => (
      <div
        className={`bg-void font-body text-text ${parameters.layout === "fullscreen" ? "" : "p-8"}`}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    backgrounds: { disable: true },
    docs: { theme: themes.dark },
    layout: "centered",
    a11y: { test: "error" },
  },
  tags: ["autodocs"],
};

export default preview;
