import { FileSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({
  icon: Icon = FileSearch,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="ds-empty">
      <div className="ds-empty__visual" aria-hidden="true">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="ds-empty__title">{title}</h3>
      <p className="ds-empty__desc">{description}</p>
    </div>
  );
}
