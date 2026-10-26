import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { TourMap } from "./TourMap";

const placeholderTheatre = { id: "sample-town", label: "Placeholder Theatre", detail: "2 Main St, Sample Town, OR", lat: 44.0, lon: -120.5, href: "/tickets/sample-town-2027-03-14" };
const all = [
  { id: "sample-city", label: "Example Hall", detail: "1 Main St, Sample City, CA", lat: 36.7783, lon: -119.4179, href: "/tickets/sample-city-2027-03-12" },
  placeholderTheatre,
  { id: "portland", label: "Venue C", detail: "3 Main St, Portland, OR", lat: 45.524, lon: -122.6766, href: "/tickets/portland-2027-03-16" },
  { id: "seattle", label: "Venue D", detail: "4 Main St, Seattle, WA", lat: 47.6136, lon: -122.3443, href: "/tickets/seattle-2027-03-18" },
  { id: "la", label: "Venue E", detail: "5 Main St, Los Angeles, CA", lat: 34.1027, lon: -118.327, href: "/tickets/la-2027-03-26" },
  { id: "sandiego", label: "Venue F", detail: "6 Main St, San Diego, CA", lat: 32.7157, lon: -117.1611, href: "/tickets/sandiego-2027-03-27" },
  { id: "phoenix", label: "Venue G", detail: "7 Main St, Phoenix, AZ", lat: 33.4945, lon: -112.0321, href: "/tickets/phoenix-2027-03-30" },
  { id: "slc", label: "Venue H", detail: "8 Main St, Salt Lake City, UT", lat: 40.7668, lon: -111.8938, href: "/tickets/slc-2027-04-01" },
  { id: "denver", label: "Venue I", detail: "9 Main St, Denver, CO", lat: 39.7403, lon: -104.9753, href: "/tickets/denver-2027-04-03" },
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
export const SingleVenue: Story = { args: { points: [placeholderTheatre], label: "Placeholder Theatre, Sample Town" } };

/** The tour page: every venue as text, with the overview map on request. */
export const Overview: Story = { args: { points: all, label: "All tour dates" } };

/** Phone width, where the list wraps and the map is shorter than wide. */
export const Phone: Story = {
  args: { points: [placeholderTheatre], label: "Placeholder Theatre, Sample Town" },
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
  args: { points: [placeholderTheatre], label: "Placeholder Theatre, Sample Town" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show map" }));
    await expect(await within(canvasElement).findByRole("region", { name: /Map:/ })).toBeVisible();
  },
};
