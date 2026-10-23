import type { Config } from "@puckeditor/core";

/**
 * Blocks installed from the P1 code registry land in this directory and are
 * registered below. `puck.config.tsx` spreads both exports, so it never needs
 * editing. Installing a block prints the exact lines to paste:
 *
 *   pnpm dlx shadcn@latest add @p1/pricing
 *
 *   import { PricingBlock } from "./pricing/pricing.block";
 *   Pricing: PricingBlock,  // in p1Blocks
 *
 *   // in p1Categories — create the entry if it does not exist yet:
 *   convert: { title: "Convert", components: ["Pricing"] },
 *   // or, if convert already exists, add to its components array (no duplicate key):
 *   // convert: { title: "Convert", components: ["Pricing", "CtaBanner"] },
 *
 * A block registered in no category still works but is listed under "Other" in
 * the drawer. Browse everything available in the P1 component catalog; to review our
 * changes to a block you have edited, add `--diff` to the install command.
 */
export const p1Blocks = {} satisfies Config["components"];

export const p1Categories = {} satisfies NonNullable<Config["categories"]>;
