import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Hero } from "./Hero";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const meta = { title: "Layout/Header, hero, footer", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;

export const Header: StoryObj = { render: () => <SiteHeader current="/tour" /> };
/** The hero on its own, filling whatever width it is given. The sized stories below embed this one. */
export const HeroFrame: StoryObj = {
  tags: ["!dev", "!autodocs"],
  render: () => (
    <Hero
      image="images/paris-on-stage.jpg"
      kicker="New album"
      title="Well Enough"
      blurb="The new album, out now on Hostile Takeover."
    />
  ),
};
/**
 * The photo is a portrait cropped into a landscape frame, so the face lands in a different place at every width.
 * Review the hero at each of these before approving a change to it: the text card must not cover the face.
 * Each story embeds the plain hero story in an iframe of the stated size, because the toolbar viewport only
 * applies in the Storybook manager and the page's media queries need a real viewport of that width.
 */
const heroAt = (width: number, height: number): StoryObj => ({
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ overflow: "auto" }}>
      <p style={{ margin: "0 0 8px", font: "12px monospace", color: "#8d8aa6" }}>{width} x {height}</p>
      <iframe title={`Hero at ${width} x ${height}`} src="iframe.html?id=layout-header-hero-footer--hero-frame&viewMode=story" width={width} height={height} style={{ border: 0, outline: "1px solid #2a2840", display: "block" }} />
    </div>
  ),
});
/** The default: how the hero looks on a wide monitor. */
export const HeroSection: StoryObj = heroAt(1920, 1080);
export const HeroPhone: StoryObj = heroAt(390, 844);
export const HeroTablet: StoryObj = heroAt(768, 1024);
export const HeroSmallLaptop: StoryObj = heroAt(1024, 768);
export const HeroLaptop: StoryObj = heroAt(1280, 800);
export const HeroDesktop: StoryObj = heroAt(1440, 900);
export const Footer: StoryObj = { render: () => <SiteFooter /> };

/** Phone width: the two footer links sit side by side and wrap if they must. */
export const FooterPhone: StoryObj = {
  render: () => (
    <div className="w-[22rem] max-w-full">
      <SiteFooter />
    </div>
  ),
};
