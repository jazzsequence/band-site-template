import { AppLink } from "../../design-system/components/AppLink";
import { absoluteUrl } from "../../lib/site/seo";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href: string };

/** Visible trail plus matching BreadcrumbList data. The last crumb is the current page and is not a link. */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          {trail.map((c, i) => (
            <li key={c.href} className="flex items-center gap-x-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i === trail.length - 1 ? (
                <span aria-current="page" className="text-text">{c.name}</span>
              ) : (
                <AppLink href={c.href} className="py-1 underline-offset-4 hover:text-text hover:underline">{c.name}</AppLink>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
        }}
      />
    </>
  );
}
