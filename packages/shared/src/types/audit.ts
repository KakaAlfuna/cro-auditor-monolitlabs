export interface AuditFinding {
  ruleId: string;
  title: string;
  severity: "critical" | "warning" | "info";
  observation: string;
  recommendation: string;
}

export interface AuditAnalysis {
  overallScore: number;
  summaryOverview: string;
  summaryStrengths: string;
  summaryWeaknesses: string;
  strengths: string[];
  issuesToFix: string[];
  findings: AuditFinding[];
  /** @deprecated Legacy field from older audits — use structured summary fields instead */
  summary?: string;
}

export interface AuditRecord {
  id: string;
  url: string;
  title: string;
  performance_score: number | null;
  /** @deprecated Use lab_lcp_ms — kept for older audits */
  lcp_ms: number | null;
  /** @deprecated Use lab_fcp_ms — kept for older audits */
  fcp_ms: number | null;
  lab_lcp_ms: number | null;
  lab_fcp_ms: number | null;
  lab_cls_score: number | null;
  lab_tbt_ms: number | null;
  total_colors: number;
  color_count_warning: boolean;
  colors: string[];
  font_families: string[];
  primary_font_family: string | null;
  semantic_markdown: string;
  analysis: AuditAnalysis;
  created_at: string;
}
