import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "flat";
}

export function Section({
  icon: Icon,
  title,
  description,
  children,
  className = "",
  variant = "default",
}: SectionProps) {
  const variantClass = variant === "flat" ? "ds-workspace-section--flat" : "";
  return (
    <section className={`ds-workspace-section ${variantClass} ${className}`.trim()}>
      <header className="ds-workspace-section__header">
        <div className="ds-workspace-section__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="ds-workspace-section__titles">
          <h2 className="ds-workspace-section__title">{title}</h2>
          {description && (
            <p className="ds-workspace-section__desc">{description}</p>
          )}
        </div>
      </header>
      <div className="ds-workspace-section__body">{children}</div>
    </section>
  );
}
