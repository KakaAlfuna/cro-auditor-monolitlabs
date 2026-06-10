import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="ds-auth-center">
      <div className="ds-auth-center__card">
        <div className="ds-auth-center__brand">
          <div className="ds-auth-center__logo" aria-hidden="true">
            M
          </div>
          <div>
            <p className="ds-auth-center__brand-name">Monolitlabs</p>
            <p className="ds-auth-center__brand-tag">CRO Auditor</p>
          </div>
        </div>

        <h1 className="ds-auth-center__title">{title}</h1>
        <p className="ds-auth-center__subtitle">{subtitle}</p>
        {children}
        <p className="ds-auth-center__footer">{footer}</p>
      </div>
    </div>
  );
}
