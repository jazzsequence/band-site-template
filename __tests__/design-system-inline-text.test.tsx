import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Hero } from "../design-system/components/Hero";
import { MerchCard } from "../design-system/components/MerchCard";
import { SectionHeading } from "../design-system/components/SectionHeading";
import { TourDateRow } from "../design-system/components/TourDateRow";

// While a page is edited in place, Puck hands a block's text over as an editable element instead of a string. These
// components draw it as given, so the text can be typed right on the page.
const el = (label: string) => <span data-editable={label}>{label}</span>;

describe("design-system text props accept an editable element", () => {
  it("Hero: kicker, title, blurb and button labels", () => {
    const html = renderToStaticMarkup(
      <Hero image="/images/x.jpg" kicker={el("kicker")} title={el("title")} blurb={el("blurb")} actions={[{ label: el("go"), href: "/listen" }, { label: el("two"), href: "/listen" }]} />,
    );
    for (const k of ["kicker", "title", "blurb", "go", "two"]) expect(html).toContain(`data-editable="${k}"`);
  });

  it("SectionHeading: kicker and title", () => {
    const html = renderToStaticMarkup(<SectionHeading kicker={el("k")}>{el("t")}</SectionHeading>);
    expect(html).toContain('data-editable="k"');
    expect(html).toContain('data-editable="t"');
  });

  it("MerchCard: name and price, with a text description for the picture", () => {
    const html = renderToStaticMarkup(<MerchCard name={el("n")} price={el("p")} image="/images/x.jpg" alt="A tee" />);
    expect(html).toContain('data-editable="n"');
    expect(html).toContain('data-editable="p"');
    expect(html).toContain("View larger: A tee");
    expect(renderToStaticMarkup(<MerchCard name={el("n")} price="$5" image="/images/x.jpg" />)).toContain("View larger: Merch item");
    expect(renderToStaticMarkup(<MerchCard name="Tee" price="$5" image="/images/x.jpg" />)).toContain("View larger: Tee");
  });

  it("TourDateRow: city, venue and capacity", () => {
    const html = renderToStaticMarkup(<TourDateRow month="NOV" day="14" year={2027} city={el("c")} venue={el("v")} capacity={el("cap")} />);
    for (const k of ["c", "v", "cap"]) expect(html).toContain(`data-editable="${k}"`);
  });
});
