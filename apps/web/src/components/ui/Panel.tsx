import type { HTMLAttributes, ReactNode } from "react";

type PanelVariant = "default" | "elevated" | "success" | "warning";

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "aside" | "div" | "article";
  variant?: PanelVariant;
  children: ReactNode;
}

export function Panel({
  as: Tag = "section",
  variant = "default",
  className = "",
  children,
  ...props
}: PanelProps) {
  const variantClass = variant === "default" ? "" : `ds-panel--${variant}`;
  const classes = ["ds-panel", variantClass, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
