import type { ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  role?: "alert" | "status";
}

export function Alert({ variant, children, role = "alert" }: AlertProps) {
  return (
    <p className={`ds-alert ds-alert--${variant}`} role={role}>
      {children}
    </p>
  );
}
