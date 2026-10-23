import { createP1AuthHandler } from "@pantheon-systems/p1-next-sdk/server";
import { getP1ApiKey } from "../../../../lib/site/p1-key";

const handler = createP1AuthHandler({
  p1ApiKey: getP1ApiKey(),
  p1BaseUrl: process.env.NEXT_PUBLIC_CSS_BASE_URL,
  prompt: "select_account",
});

export const { POST } = handler;
