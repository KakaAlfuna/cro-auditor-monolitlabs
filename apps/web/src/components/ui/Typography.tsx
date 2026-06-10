import type { HTMLAttributes, ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
  return <p className="ds-eyebrow">{children}</p>;
}

type HeadingLevel = 1 | 2 | 3;

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  children: ReactNode;
}

export function Heading({ level = 2, className = "", children, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  const classes = [`ds-heading`, `ds-heading--${level}`, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: "default" | "secondary" | "muted";
  size?: "default" | "sm";
  children: ReactNode;
}

export function Text({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}: TextProps) {
  const classes = [
    "ds-text",
    variant !== "default" ? `ds-text--${variant}` : "",
    size === "sm" ? "ds-text--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}
