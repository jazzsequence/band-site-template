import config from "../../band.config.json";
import { resolvePalette, validatePalette } from "./palette";

/**
 * The palette the site actually renders: band.config.json after the contrast gate, the same values
 * theme.generated.css holds. Use it where a colour must be a literal (theme-color, the web manifest).
 */
export const { palette } = resolvePalette(validatePalette(config.palette));
