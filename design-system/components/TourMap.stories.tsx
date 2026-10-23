import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { TourMap } from "./TourMap";

const oakland = { id: "oakland", label: "Paramount Theatre", detail: "2025 Broadway, Oakland, CA", lat: 37.8099, lon: -122.2687, href: "/tickets/oakland-1997-10-18" };
const all = [
  { id: "sf", label: "Roderick's Chamber", detail: "715 Harrison St, San Francisco, CA", lat: 37.7821, lon: -122.3976, href: "/tickets/sf-1997-10-07" },
  oakland,
  { id: "portland", label: "Satyricon", detail: "125 NW 6th Ave, Portland, OR", lat: 45.524, lon: -122.6766, href: "/tickets/portland-1997-10-21" },
  { id: "seattle", label: "Crocodile Cafe", detail: "2200 2nd Ave, Seattle, WA", lat: 47.6136, lon: -122.3443, href: "/tickets/seattle-1997-10-23" },
  { id: "la", label: "Hollywood Palace", detail: "1735 N Vine St, Los Angeles, CA", lat: 34.1027, lon: -118.327, href: "/tickets/la-1997-10-31" },
  { id: "sandiego", label: "Belly Up Tavern", detail: "143 S Cedros Ave, Solana Beach, CA", lat: 32.991, lon: -117.2707, href: "/tickets/sandiego-1997-11-01" },
  { id: "phoenix", label: "Mason Jar", detail: "2303 E Indian School Rd, Phoenix, AZ", lat: 33.4945, lon: -112.0321, href: "/tickets/phoenix-1997-11-04" },
  { id: "slc", label: "Club DV8", detail: "115 S West Temple, Salt Lake City, UT", lat: 40.7668, lon: -111.8938, href: "/tickets/slc-1997-11-06" },
  { id: "denver", label: "Ogden Theatre", detail: "935 E Colfax Ave, Denver, CO", lat: 39.7403, lon: -104.9753, href: "/tickets/denver-1997-11-08" },
];

const meta = {
  title: "Components/TourMap",
  component: TourMap,
  args: { workerUrl: "maplibre/maplibre-gl-worker.mjs" },
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="mx-auto max-w-3xl"><Story /></div>],
} satisfies Meta<typeof TourMap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A show's page. Plain text until "Show map" is clicked: no tiles are requested and nothing leaves the site. */
export const SingleVenue: Story = { args: { points: [oakland], label: "Paramount Theatre, Oakland" } };

/** The tour page: every venue as text, with the overview map on request. */
export const Overview: Story = { args: { points: all, label: "All tour dates" } };

/** Phone width, where the list wraps and the map is shorter than wide. */
export const Phone: Story = {
  args: { points: [oakland], label: "Paramount Theatre, Oakland" },
  decorators: [(Story) => <div className="w-[22rem] max-w-full"><Story /></div>],
};

/** Tablet width. The list sits on one line per venue and the map is as wide as the card. */
export const Tablet: Story = {
  args: { points: all.slice(0, 4), label: "Tour dates" },
  decorators: [(Story) => <div className="w-[48rem] max-w-full"><Story /></div>],
};

/** Laptop width, with the whole tour listed. */
export const Laptop: Story = {
  args: { points: all, label: "All tour dates" },
  decorators: [(Story) => <div className="w-[64rem] max-w-full"><Story /></div>],
};

/** The map after the visitor asks for it. This story clicks the button, so it contacts OpenStreetMap when it runs. */
export const Loaded: Story = {
  args: { points: [oakland], label: "Paramount Theatre, Oakland" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show map" }));
    await expect(await within(canvasElement).findByRole("region", { name: /Map:/ })).toBeVisible();
  },
};
