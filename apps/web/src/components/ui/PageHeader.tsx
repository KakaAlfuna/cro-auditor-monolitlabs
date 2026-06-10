import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="ds-page-header">
      <div className="ds-page-header__text">
        <h1 className="ds-page-header__title">{title}</h1>
        {description && <p className="ds-page-header__desc">{description}</p>}
      </div>
      {action && <div className="ds-page-header__action">{action}</div>}
    </header>
  );
}
