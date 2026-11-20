"use client";

import { useEffect, useReducer } from "react";
import type { Field } from "@puckeditor/core";
import { RichTextMenu } from "@puckeditor/core";

import { safeHref } from "./safe-link";

/**
 * The rich text field for long text (the Article block). Puck's own toolbar has no button to add a link or to take one back
 * off, so this one adds three one-click buttons: Add link (select words, press it, type the address), Remove link, and Clear
 * formatting. Typing Markdown, `[words](https://…)`, also becomes a link.
 *
 * Imports nothing from tiptap on purpose: every tiptap package peer-pins the exact version of the others, so a direct
 * dependency here would have to move in lockstep with Puck's and would break the next Puck upgrade. Everything works through
 * the `editor` Puck hands to the menu instead. Buttons only, no address form: a form inside Puck's toolbar can submit the page
 * instead of the link (seen on communitycode-p1, where this came from). Every address goes through `safeHref`, so a
 * `javascript:` link is never created.
 *
 * Only really proven in the P1 editor: the unit tests drive these functions with a stand-in editor.
 */
type RichtextField = Extract<Field, { type: "richtext" }>;
type MenuProps = Parameters<NonNullable<RichtextField["renderMenu"]>>[0];
export type EditorLike = NonNullable<MenuProps["editor"]>;

const MARKDOWN_LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)$/;

/**
 * If the text just before the caret is `[words](address)`, replace it with `words` as a link. Returns whether it did. An
 * unsafe address (`javascript:` and friends) is left as typed text.
 */
export function convertMarkdownLink(editor: EditorLike): boolean {
  const { selection } = editor.state;
  const link = editor.schema.marks.link;
  if (!selection.empty || !link) return false;
  const { $from } = selection;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
  if (!before.endsWith(")")) return false;
  const m = MARKDOWN_LINK.exec(before);
  const href = m ? safeHref(m[2]) : null;
  if (!m || !href) return false;
  const start = $from.start() + m.index;
  return editor
    .chain()
    .deleteRange({ from: start, to: selection.from })
    .insertContent({ type: "text", text: m[1], marks: [{ type: "link", attrs: { href } }] })
    .run();
}

/** Is the caret in a link, or does the selection touch one? */
export function hasLink(editor: EditorLike): boolean {
  const type = editor.schema.marks.link;
  if (!type) return false;
  const { from, to, empty, $from } = editor.state.selection;
  return empty ? !!type.isInSet($from.marks()) : editor.state.doc.rangeHasMark(from, to, type);
}

/** Remove the link: the whole link when the caret is inside it, or just the selected part. */
export function removeLink(editor: EditorLike): boolean {
  return editor.chain().focus().unsetLink().run();
}

/** Remove links, bold, italic and the like, and turn blocks back into plain paragraphs. */
export function clearFormatting(editor: EditorLike): boolean {
  return editor.chain().focus().unsetLink().unsetAllMarks().clearNodes().run();
}

/**
 * Make the selected words a link to an address the editor types in. Does nothing when no words are selected, the prompt is
 * cancelled, or the address is not safe (it says so, rather than failing silently).
 */
export function addLink(
  editor: EditorLike,
  ask: (message: string, initial?: string) => string | null = (m, i) => window.prompt(m, i),
  tell: (message: string) => void = (m) => window.alert(m),
): boolean {
  if (editor.state.selection.empty) return false;
  const current = (editor.getAttributes("link") as { href?: string }).href ?? "";
  const answer = ask("Link address (a page like /bio, or https://…)", current);
  if (answer === null) return false;
  if (answer.trim() === "") return removeLink(editor);
  const href = safeHref(answer);
  if (!href) {
    tell("That address can't be used. Use a page like /bio, an https:// address or a mailto: address.");
    return false;
  }
  return editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const LinkIcon = () => (
  <svg {...svg}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const UnlinkIcon = () => (
  <svg {...svg}>
    <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
    <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
    <line x1="8" x2="8" y1="2" y2="5" />
    <line x1="2" x2="5" y1="8" y2="8" />
    <line x1="16" x2="16" y1="19" y2="22" />
    <line x1="19" x2="22" y1="16" y2="16" />
  </svg>
);

const ClearIcon = () => (
  <svg {...svg}>
    <path d="M4 7V4h16v3" />
    <path d="M5 20h6" />
    <path d="M13 4 8 20" />
    <path d="m15 15 5 5" />
    <path d="m20 15-5 5" />
  </svg>
);

function Menu({ editor, full }: { editor: MenuProps["editor"]; full: boolean }) {
  // Puck re-renders its menu only when its own selector state changes (bold, lists...), not when the selection moves, so
  // "is there a link here?" would go stale. Follow the editor directly.
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    // Typing the closing bracket of [words](https://…) makes it a link. Done after the keystroke lands, from the menu's own
    // subscription, so no tiptap extension is needed.
    const onUpdate = () => {
      convertMarkdownLink(editor);
    };
    editor.on("transaction", refresh);
    editor.on("update", onUpdate);
    return () => {
      editor.off("transaction", refresh);
      editor.off("update", onUpdate);
    };
  }, [editor]);

  return (
    <RichTextMenu>
      {full ? (
        <RichTextMenu.Group>
          <RichTextMenu.HeadingSelect />
        </RichTextMenu.Group>
      ) : null}
      <RichTextMenu.Group>
        <RichTextMenu.Bold />
        <RichTextMenu.Italic />
        <RichTextMenu.Underline />
      </RichTextMenu.Group>
      <RichTextMenu.Group>
        <RichTextMenu.Control
          icon={<LinkIcon />}
          title="Add link"
          disabled={!editor || editor.state.selection.empty}
          onClick={(e) => {
            e.stopPropagation();
            if (editor) addLink(editor);
          }}
        />
        <RichTextMenu.Control
          icon={<UnlinkIcon />}
          title="Remove link"
          disabled={!editor || !hasLink(editor)}
          onClick={(e) => {
            e.stopPropagation();
            if (editor) removeLink(editor);
          }}
        />
        <RichTextMenu.Control
          icon={<ClearIcon />}
          title="Clear formatting"
          disabled={!editor}
          onClick={(e) => {
            e.stopPropagation();
            if (editor) clearFormatting(editor);
          }}
        />
      </RichTextMenu.Group>
      {full ? (
        <RichTextMenu.Group>
          <RichTextMenu.BulletList />
          <RichTextMenu.OrderedList />
          <RichTextMenu.Blockquote />
        </RichTextMenu.Group>
      ) : null}
    </RichTextMenu>
  );
}

const InlineMenu = ({ editor }: MenuProps) => <Menu editor={editor} full={false} />;
const FullMenu = ({ editor }: MenuProps) => <Menu editor={editor} full />;

/** Headings 1 to 3, lists, quotes and links, edited right on the page. */
export const articleRichtextField: RichtextField = {
  type: "richtext",
  label: "Text",
  contentEditable: true,
  initialHeight: 320,
  // Clicking a link while editing should place the cursor, not navigate away from the editor.
  options: { textAlign: false, heading: { levels: [1, 2, 3] }, link: { openOnClick: false } },
  renderMenu: FullMenu,
  renderInlineMenu: InlineMenu,
};
