import * as React from "react";
import "./btn.css";

/**
 * Shared pill button used across blocks (Hero, CTA, Pricing, Lead capture,
 * Feature+Media, Button…). Renders an <a> when `href` is set, else a <span>
 * — matching the static, non-interactive style of the prototype's CanvasButton.
 * `target="_blank"` opens the link in a new tab and adds
 * `rel="noopener noreferrer"`.
 * Shared utility — not a Puck block.
 */
export type BtnVariant = "primary" | "secondary" | "yellow" | "purple" | "dark";

export interface BtnProps {
  variant?: BtnVariant;
  href?: string;
  target?: "_self" | "_blank";
  children: React.ReactNode;
  className?: string;
}

export function safeHref(h: string): string {
  return /^(https?:\/\/|\/|#)/.test(h) ? h : "#";
}

/** Anchor attributes for a link that may open in a new tab. */
export function linkTargetProps(target?: "_self" | "_blank") {
  return target === "_blank"
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : {};
}

export function Btn({ variant = "primary", href, target, children, className = "" }: BtnProps) {
  const cls = ["p1-btn", className].filter(Boolean).join(" ");
  if (href) {
    return (
      <a href={safeHref(href)} className={cls} data-variant={variant} {...linkTargetProps(target)}>
        {children}
      </a>
    );
  }
  return (
    <span className={cls} data-variant={variant}>
      {children}
    </span>
  );
}

export interface TextLinkProps {
  href?: string;
  target?: "_self" | "_blank";
  className?: string;
  children: React.ReactNode;
  [dataAttr: `data-${string}`]: string | undefined;
}

/**
 * Text-style link used where a block shows a secondary action or inline link.
 * Renders an <a> when `href` is set, else a <span>, so content saved without a
 * link renders as before.
 */
export function TextLink({ href, target, className, children, ...rest }: TextLinkProps) {
  if (href) {
    return (
      <a href={safeHref(href)} className={className} {...rest} {...linkTargetProps(target)}>
        {children}
      </a>
    );
  }
  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}
