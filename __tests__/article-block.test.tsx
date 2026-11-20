import { Render, type Data } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { articleBlock } from "../components/puck/band/content-blocks";
import config from "../puck.config";

const page = (props: object): Data => ({ root: { props: {} }, content: [{ type: "ArticleBlock", props: { id: "article-1", ...props } }] }) as Data;
const html = (props: object) => renderToStaticMarkup(<Render config={config} data={page(props)} />);

describe("the Article block", () => {
  it("is edited as rich text on the page, not in a Markdown box", () => {
    const body = (articleBlock.fields as Record<string, { type: string; contentEditable?: boolean }>).body;
    expect(body.type).toBe("richtext");
    expect(body.contentEditable).toBe(true);
    expect(Object.keys(articleBlock.fields)).not.toContain("markdown");
  });

  it("renders the rich text, headings and links included", () => {
    const out = html({ body: '<h2>Short bio</h2><p>Born in <strong>Daly City</strong>. <a href="/bio">More</a></p>' });
    expect(out).toContain("<h2>Short bio</h2>");
    expect(out).toContain("<strong>Daly City</strong>");
    expect(out).toContain('href="/bio"');
  });

  it("keeps rendering pages that were written as Markdown, until text is put in the rich text field", () => {
    expect(html({ markdown: "## Old page\n\nStill here." })).toContain("<h2>Old page</h2>");
    const both = html({ markdown: "## Old page", body: "<h2>New page</h2>" });
    expect(both).toContain("New page");
    expect(both).not.toContain("Old page");
  });
});
