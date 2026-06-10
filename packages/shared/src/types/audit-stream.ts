import type { AuditRecord } from "./audit";

export type AuditStepId =
  | "validating"
  | "scraping"
  | "performance"
  | "analyzing"
  | "saving";

export type AuditStepStatus = "pending" | "running" | "done" | "error";

export interface AuditProgressPayload {
  step: AuditStepId;
  message: string;
  status: AuditStepStatus;
}

export interface AuditCompletePayload {
  audit: AuditRecord;
}

export interface AuditErrorPayload {
  message: string;
}

export type AuditStreamEvent =
  | { type: "progress"; data: AuditProgressPayload }
  | { type: "complete"; data: AuditCompletePayload }
  | { type: "error"; data: AuditErrorPayload };

export const AUDIT_STEP_ORDER: readonly { id: AuditStepId; label: string }[] = [
  { id: "validating", label: "Validating URL" },
  { id: "scraping", label: "Scraping page" },
  { id: "performance", label: "Test performance" },
  { id: "analyzing", label: "AI analysis" },
  { id: "saving", label: "Saving report" },
] as const;
