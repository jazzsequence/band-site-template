import { DEFAULT_TYPOGRAPHY, type Typography } from "../../lib/theme/fonts";

/** Every optional role set: a wordmark face in capitals and a kicker face, so tests cover the paths the defaults skip. */
export const FULL_TYPOGRAPHY: Typography = {
  ...DEFAULT_TYPOGRAPHY,
  wordmark: { id: "unbounded", family: "Unbounded", category: "sans-serif", variable: true, weights: [200, 300, 400, 500, 600, 700, 800, 900], uppercase: true },
  kicker: { id: "unifrakturcook", family: "UnifrakturCook", category: "display", variable: false, weights: [700] },
};
