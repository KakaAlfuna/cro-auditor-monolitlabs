import type { AuditRecord } from "@cro-auditor/shared/types/audit";
import { normalizeAuditAnalysis } from "@cro-auditor/shared/normalize-audit-analysis";

export interface AuditSummaryStats {
  totalAudits: number;
  averageScore: number | null;
  criticalFindings: number;
  lastAudit: AuditRecord | null;
}

export function computeAuditStats(audits: AuditRecord[]): AuditSummaryStats {
  if (audits.length === 0) {
    return {
      totalAudits: 0,
      averageScore: null,
      criticalFindings: 0,
      lastAudit: null,
    };
  }

  const totalScore = audits.reduce((sum, audit) => {
    const analysis = normalizeAuditAnalysis(audit.analysis, {
      pageSpeedScore: audit.performance_score,
      totalColors: audit.total_colors,
    });
    return sum + analysis.overallScore;
  }, 0);
  const criticalFindings = audits.reduce((sum, audit) => {
    const analysis = normalizeAuditAnalysis(audit.analysis, {
      pageSpeedScore: audit.performance_score,
      totalColors: audit.total_colors,
    });
    return (
      sum + analysis.findings.filter((finding) => finding.severity === "critical").length
    );
  }, 0);

  return {
    totalAudits: audits.length,
    averageScore: Math.round(totalScore / audits.length),
    criticalFindings,
    lastAudit: audits[0] ?? null,
  };
}
