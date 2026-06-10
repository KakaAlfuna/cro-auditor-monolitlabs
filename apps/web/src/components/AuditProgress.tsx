import {
  AUDIT_STEP_ORDER,
  type AuditProgressPayload,
  type AuditStepId,
  type AuditStepStatus,
} from "@cro-auditor/shared/types/audit-stream";
import { Check, Circle, Loader2, X, type LucideIcon } from "lucide-react";

interface AuditProgressProps {
  steps: Partial<Record<AuditStepId, AuditProgressPayload>>;
}

function statusIcon(status: AuditStepStatus | undefined): LucideIcon {
  if (status === "done") return Check;
  if (status === "running") return Loader2;
  if (status === "error") return X;
  return Circle;
}

export function AuditProgress({ steps }: AuditProgressProps) {
  return (
    <ol className="ds-progress" aria-live="polite" aria-label="Audit progress">
      {AUDIT_STEP_ORDER.map(({ id, label }) => {
        const step = steps[id];
        const status = step?.status ?? "pending";
        const Icon = statusIcon(status);

        return (
          <li
            key={id}
            className={`ds-progress__step ds-progress__step--${status}`}
            data-status={status}
          >
            <span className="ds-progress__icon" aria-hidden="true">
              <Icon
                size={14}
                strokeWidth={2.5}
                className={status === "running" ? "ds-icon-spin" : undefined}
              />
            </span>
            <span className="ds-progress__content">
              <span className="ds-progress__label">{label}</span>
              {step?.message && (
                <span className="ds-progress__message">{step.message}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
