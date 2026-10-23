import { promises as fs } from "node:fs";
import path from "node:path";

import type { Data } from "@puckeditor/core";
import { notFound } from "next/navigation";

import { P1Page } from "../../../../components/site/p1-page";

/**
 * Test-only. Renders a page definition from content/p1-pages/ through the real P1 pipeline (data provider,
 * Puck renderer, edit pill), so CI can exercise the P1 blocks without P1 credentials. It does not exist
 * unless E2E_FIXTURES=1, which only the Playwright web server sets.
 */
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function Fixture({ params }: { params: Promise<{ name: string }> }) {
  if (process.env.E2E_FIXTURES !== "1") notFound();
  const { name } = await params;
  if (!/^[a-z-]+$/.test(name)) notFound();
  let doc: { path: string; root: Data["root"]; content: Data["content"] };
  try {
    doc = JSON.parse(await fs.readFile(path.join(process.cwd(), "content", "p1-pages", `${name}.json`), "utf8"));
  } catch {
    notFound();
  }
  return <P1Page data={{ root: doc.root, content: doc.content, zones: {} }} path={doc.path} />;
}
