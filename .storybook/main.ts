import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  core: { disableTelemetry: true },
  stories: [
    "../design-system/**/*.mdx",
    "../design-system/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  staticDirs: ["../public"],
  // `pnpm build-storybook` writes into the repo; without this the dev server sees that
  // output change and reloads mid-session, which shows up as an endless spinner.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    server: {
      ...viteConfig.server,
      watch: { ...viteConfig.server?.watch, ignored: ["**/storybook-static/**"] },
    },
  }),
};

export default config;
