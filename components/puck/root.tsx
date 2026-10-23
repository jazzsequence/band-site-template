import type { ReactNode } from "react";
import {
  createSeoRootFields,
  DEFAULT_EDITOR_ROOT_TITLE,
} from "@pantheon-systems/puck-css/seo";

import { SiteFooter } from "../../design-system/components/SiteFooter";
import { SiteHeader } from "../../design-system/components/SiteHeader";

/**
 * The root config: this site's own fields, plus the page-metadata fields.
 *
 * Title and description are yours to change — they are the site's content. The
 * `_meta` field set is not composed here by hand: it writes a stored shape the
 * head tags read back, so it comes from the package that owns that shape and
 * versions with it.
 */

const buildFields = (rootProps?: Record<string, unknown>) => ({
  title: { type: "text" as const },
  description: { type: "textarea" as const },
  ...createSeoRootFields(rootProps),
});

export const puckRoot = {
  fields: buildFields(),
  /**
   * Passing the live root props is what lets the metadata fields show what an
   * empty one will inherit — the fields slice subscribes to the root node, so
   * changing the title re-resolves the placeholders.
   */
  resolveFields: (data: { props?: Record<string, unknown> }) =>
    buildFields(data.props ?? {}),
  defaultProps: {
    title: DEFAULT_EDITOR_ROOT_TITLE,
  },
  render: (props: { children?: ReactNode; title?: string; puck?: { isEditing?: boolean } }) => {
    const { children, puck } = props;
    // The public site gets its header and footer from the (site) layout, so the root adds nothing there. The editor
    // canvas has no layout, so it shows the same header and footer around the page, locked (inert) so they can be
    // seen but not clicked or edited, to let people build a page as it will actually look.
    if (puck?.isEditing) {
      return (
        <div className="flex min-h-screen flex-col bg-void font-body text-text antialiased">
          <div inert aria-hidden="true">
            <SiteHeader />
          </div>
          <main className="flex-1">{children}</main>
          <div inert aria-hidden="true">
            <SiteFooter />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-void font-body text-text antialiased">
        {children}
      </div>
    );
  },
};
