import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { AppLink } from "./AppLink";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-xs font-semibold uppercase tracking-[0.18em] transition focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-magenta text-void shadow-glow-magenta hover:brightness-110 [clip-path:polygon(0_0,100%_0,100%_70%,92%_100%,0_100%)]",
  outline:
    "border border-cyan text-cyan hover:bg-cyan hover:text-void hover:shadow-glow-cyan",
  ghost: "text-muted hover:text-text underline-offset-8 hover:underline",
};

type Common = { variant?: Variant };

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <AppLink className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </AppLink>
  );
}
