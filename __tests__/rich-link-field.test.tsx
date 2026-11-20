import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";
import { articleBlock } from "../components/puck/band/content-blocks";
import { addLink, articleRichtextField, clearFormatting, convertMarkdownLink, removeLink, type EditorLike } from "../lib/rich-link-field";
import { safeHref } from "../lib/safe-link";

// These drive the toolbar's actions with a stand-in editor that records what it is asked to do. The toolbar itself only really
// proves out in the P1 editor (it needs Puck's editor context), so it is checked there by hand.
function fakeEditor(opts: { empty?: boolean; href?: string; before?: string } = {}) {
  const calls: string[] = [];
  const chain: Record<string, unknown> = new Proxy(
    {},
    {
      get: (_t, name: string) =>
        name === "run"
          ? () => {
              calls.push("run");
              return true;
            }
          : (...args: unknown[]) => {
              calls.push(`${name}(${args.map((a) => JSON.stringify(a)).join(",")})`);
              return chain;
            },
    },
  );
  const before = opts.before ?? "";
  const editor = {
    chain: () => chain,
    getAttributes: () => (opts.href ? { href: opts.href } : {}),
    schema: { marks: { link: {} } },
    state: {
      selection: {
        empty: opts.empty ?? false,
        from: before.length + 1,
        $from: { parent: { textBetween: () => before }, parentOffset: before.length, start: () => 1 },
      },
    },
  } as unknown as EditorLike;
  return { editor, calls };
}

describe("safeHref", () => {
  it("allows pages on the site, https, http and mailto", () => {
    for (const ok of ["/bio", "about", "#top", "?q=x", "https://cilla.jazzsequence.com/bio", "http://example.org", "mailto:a@b.test"])
      expect(safeHref(ok), ok).toBe(ok);
    expect(safeHref("  /bio  ")).toBe("/bio");
  });

  it("refuses everything that could run script or leave the site by a side door", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "java\tscript:alert(1)",
      "data:text/html,<b>x</b>",
      "vbscript:x",
      "file:///etc/passwd",
      "//evil.example",
      "\\\\evil.example",
      "https://user:pass@example.org",
      "mailto:",
      "",
      "   ",
      "/a b",
    ])
      expect(safeHref(bad), JSON.stringify(bad)).toBeNull();
    expect(safeHref(undefined)).toBeNull();
    expect(safeHref(42)).toBeNull();
  });
});

describe("the Article's rich text field", () => {
  it("is edited on the page, with headings 1 to 3, and a click on a link places the cursor instead of leaving", () => {
    expect(articleRichtextField.type).toBe("richtext");
    expect(articleRichtextField.contentEditable).toBe(true);
    expect(articleRichtextField.options).toMatchObject({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } });
    expect(articleRichtextField.renderMenu).toBeTypeOf("function");
    expect(articleRichtextField.renderInlineMenu).toBeTypeOf("function");
    expect((articleBlock.fields as Record<string, unknown>).body).toBe(articleRichtextField);
  });
});

describe("toolbar actions", () => {
  it("Remove link unsets the link", () => {
    const { editor, calls } = fakeEditor();
    expect(removeLink(editor)).toBe(true);
    expect(calls).toEqual(["focus()", "unsetLink()", "run"]);
  });

  it("Clear formatting takes off links, marks and block styles", () => {
    const { editor, calls } = fakeEditor();
    clearFormatting(editor);
    expect(calls).toEqual(["focus()", "unsetLink()", "unsetAllMarks()", "clearNodes()", "run"]);
  });

  describe("Add link", () => {
    it("links the selected words to the address typed", () => {
      const { editor, calls } = fakeEditor();
      expect(addLink(editor, () => "/bio")).toBe(true);
      expect(calls).toEqual(["focus()", 'extendMarkRange("link")', 'setLink({"href":"/bio"})', "run"]);
    });

    it("offers the current address when the selection is already a link", () => {
      const { editor } = fakeEditor({ href: "https://old.test" });
      const ask = vi.fn(() => "https://new.test");
      addLink(editor, ask);
      expect(ask).toHaveBeenCalledWith(expect.any(String), "https://old.test");
    });

    it("does nothing with no words selected or when the prompt is cancelled", () => {
      const none = fakeEditor({ empty: true });
      const ask = vi.fn(() => "/bio");
      expect(addLink(none.editor, ask)).toBe(false);
      expect(ask).not.toHaveBeenCalled();
      const cancelled = fakeEditor();
      expect(addLink(cancelled.editor, () => null)).toBe(false);
      expect(cancelled.calls).toEqual([]);
    });

    it("an empty answer removes the link", () => {
      const { editor, calls } = fakeEditor();
      addLink(editor, () => "  ");
      expect(calls).toContain("unsetLink()");
    });

    it("refuses an unsafe address, and says so", () => {
      const { editor, calls } = fakeEditor();
      const tell = vi.fn();
      expect(addLink(editor, () => "javascript:alert(1)", tell)).toBe(false);
      expect(tell).toHaveBeenCalledOnce();
      expect(calls).toEqual([]);
    });
  });

  describe("typing [words](address)", () => {
    it("turns the Markdown just typed into a link and drops the syntax", () => {
      const before = "Read [the manifesto](https://example.org/m/)";
      const { editor, calls } = fakeEditor({ empty: true, before });
      expect(convertMarkdownLink(editor)).toBe(true);
      // the Markdown starts at the "[": one past the paragraph's start plus "Read " (5 characters); it ends at the caret
      expect(calls[0]).toBe(`deleteRange({"from":6,"to":${before.length + 1}})`);
      expect(calls[1]).toBe(
        'insertContent({"type":"text","text":"the manifesto","marks":[{"type":"link","attrs":{"href":"https://example.org/m/"}}]})',
      );
    });

    it("accepts a page on the site", () => {
      const { editor, calls } = fakeEditor({ empty: true, before: "[about](/about)" });
      expect(convertMarkdownLink(editor)).toBe(true);
      expect(calls.join(" ")).toContain('"href":"/about"');
    });

    it("leaves an unsafe address, and text that is not a complete link, as typed", () => {
      for (const before of ["[click](javascript:alert(1))", "[half](https://example.org", "plain text)", "[a]"]) {
        const { editor, calls } = fakeEditor({ empty: true, before });
        expect(convertMarkdownLink(editor), before).toBe(false);
        expect(calls, before).toEqual([]);
      }
    });

    it("does nothing while words are selected", () => {
      const { editor, calls } = fakeEditor({ empty: false, before: "[a](/b)" });
      expect(convertMarkdownLink(editor)).toBe(false);
      expect(calls).toEqual([]);
    });
  });
});

describe("the Article's text on the page", () => {
  const html = (props: object) => renderToStaticMarkup(articleBlock.render({ kicker: "", ...props } as never));

  it("sanitises stored HTML: a script link is dropped, ordinary links and the page's h1 stay", () => {
    const out = html({
      body: '<h1>Title</h1><p><a href="javascript:alert(1)">bad</a> <a href="/bio">good</a> <a href="https://example.org">out</a></p><script>x()</script>',
    });
    expect(out).toContain("<h1>Title</h1>");
    expect(out).toContain('href="/bio"');
    expect(out).toContain('href="https://example.org"');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<script");
  });

  it("passes an already-rendered node through (what the editor and the public page hand over)", () => {
    expect(html({ body: <p>from the editor</p> })).toContain("<p>from the editor</p>");
  });

  it("still renders a page that only has Markdown", () => {
    expect(html({ markdown: "## Old\n\n[a link](/bio)" })).toContain('<a href="/bio">a link</a>');
  });
});
