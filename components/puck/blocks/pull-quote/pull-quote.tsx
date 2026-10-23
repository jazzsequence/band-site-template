import { RichValue } from "@/lib/rich";
import "./pull-quote.css";

export interface PullQuoteProps {
  quote: string;
  cite: string;
  // "yellow rule" is the legacy value of "accent rule"; pages saved with it still render.
  accent: "accent rule" | "yellow rule" | "quote mark" | "none";
  align: "center" | "left";
}

export function PullQuoteRender({ quote, cite, accent, align }: PullQuoteProps) {
  return (
    <div className="p1-pull-quote p1-block" data-align={align} data-accent={accent}>
      <div className="p1-pull-quote__inner">
        <blockquote className="p1-pull-quote__blockquote">
          {(accent === "accent rule" || accent === "yellow rule") && <div className="p1-pull-quote__rule" />}
          {accent === "quote mark" && <div className="p1-pull-quote__mark" aria-hidden="true">&ldquo;</div>}
          <div className="p1-pull-quote__text">
            <RichValue value={quote} />
          </div>
          {cite && <cite className="p1-pull-quote__cite">&mdash; {cite}</cite>}
        </blockquote>
      </div>
    </div>
  );
}
