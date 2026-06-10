import type { ReactNode } from "react";
import type { AuditFinding, AuditRecord } from "@cro-auditor/shared/types/audit";
import { normalizeAuditAnalysis } from "@cro-auditor/shared/normalize-audit-analysis";
import { CheckCircle2, ExternalLink, TriangleAlert, Wrench } from "lucide-react";
import { Badge, ScoreRing } from "./ui";
import { ColorWarning } from "./ColorWarning";
import { MetricsPanel } from "./MetricsPanel";

interface AuditResultsProps {
  audit: AuditRecord;
}

const SEVERITY_VARIANT: Record<string, "critical" | "warning" | "info"> = {
  critical: "critical",
  warning: "warning",
  info: "info",
};

export function AuditResults({ audit }: AuditResultsProps) {
  const analysis = normalizeAuditAnalysis(audit.analysis, {
    pageSpeedScore: audit.performance_score,
    totalColors: audit.total_colors,
  });
  const criticalCount = analysis.findings.filter((f) => f.severity === "critical").length;
  const warningCount = analysis.findings.filter((f) => f.severity === "warning").length;

  return (
    <div className="ds-results">
      <header className="ds-results-header">
        <div className="ds-results-header__info">
          <h2 className="ds-results-header__title">{audit.title}</h2>
          <a
            href={audit.url}
            target="_blank"
            rel="noreferrer"
            className="ds-results-header__url"
          >
            <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
            {audit.url}
          </a>
          <p className="ds-results-header__date">
            {new Date(audit.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <ScoreRing score={analysis.overallScore} />
      </header>

      <section className="ds-results-summary-block" aria-labelledby="audit-summary-heading">
        <h3 id="audit-summary-heading" className="ds-results-summary-block__heading">
          Overall assessment
        </h3>
        {analysis.summaryOverview && (
          <p className="ds-results-summary-block__overview">{analysis.summaryOverview}</p>
        )}
        <div className="ds-results-summary-grid">
          {analysis.summaryStrengths && (
            <div className="ds-results-summary-card ds-results-summary-card--good">
              <h4 className="ds-results-summary-card__title">
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                What&apos;s working well
              </h4>
              <p className="ds-results-summary-card__body">{analysis.summaryStrengths}</p>
            </div>
          )}
          {analysis.summaryWeaknesses && (
            <div className="ds-results-summary-card ds-results-summary-card--bad">
              <h4 className="ds-results-summary-card__title">
                <TriangleAlert size={16} strokeWidth={2} aria-hidden="true" />
                What needs improvement
              </h4>
              <p className="ds-results-summary-card__body">{analysis.summaryWeaknesses}</p>
            </div>
          )}
        </div>
      </section>

      <div className="ds-results-metrics">
        <MetricsPanel
          performanceScore={audit.performance_score}
          labLcpMs={audit.lab_lcp_ms ?? audit.lcp_ms}
          labFcpMs={audit.lab_fcp_ms ?? audit.fcp_ms}
          labClsScore={audit.lab_cls_score}
          labTbtMs={audit.lab_tbt_ms}
          primaryFont={audit.primary_font_family}
        />
        <ColorWarning
          totalColors={audit.total_colors}
          colors={audit.colors}
          hasWarning={audit.color_count_warning}
        />
      </div>

      <div className="ds-results-lists">
        {analysis.strengths.length > 0 && (
          <ActionList
            title="Already good"
            icon={<CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />}
            items={analysis.strengths}
            variant="good"
          />
        )}
        {analysis.issuesToFix.length > 0 && (
          <ActionList
            title="Must fix"
            icon={<Wrench size={16} strokeWidth={2} aria-hidden="true" />}
            items={analysis.issuesToFix}
            variant="bad"
          />
        )}
      </div>

      <div className="ds-section">
        <div className="ds-section__header">
          <h4 className="ds-section__title">Framework findings</h4>
          <span className="ds-section__count">
            {analysis.findings.length} total
            {criticalCount > 0 && ` · ${criticalCount} critical`}
            {warningCount > 0 && ` · ${warningCount} warning`}
          </span>
        </div>

        <ul className="ds-stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {analysis.findings.map((finding) => (
            <li key={finding.ruleId}>
              <FindingCard finding={finding} />
            </li>
          ))}
        </ul>
      </div>

      <details className="ds-collapsible ds-collapsible--inline">
        <summary>Page content (semantic markdown)</summary>
        <pre>{audit.semantic_markdown}</pre>
      </details>
    </div>
  );
}

function ActionList({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  variant: "good" | "bad";
}) {
  return (
    <section className={`ds-action-list ds-action-list--${variant}`}>
      <h4 className="ds-action-list__title">
        {icon}
        {title}
        <span className="ds-action-list__count">{items.length}</span>
      </h4>
      <ul className="ds-action-list__items">
        {items.map((item) => (
          <li key={item} className="ds-action-list__item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const variant = SEVERITY_VARIANT[finding.severity] ?? "info";

  return (
    <div className={`ds-finding ds-finding--${variant}`}>
      <div className="ds-finding__meta">
        <span className="ds-finding__rule">{finding.ruleId}</span>
        <Badge variant={variant}>{finding.severity}</Badge>
      </div>
      <h4 className="ds-finding__title">{finding.title}</h4>
      <p className="ds-finding__body">
        <strong>Observation</strong> — {finding.observation}
      </p>
      <p className="ds-finding__body">
        <strong>Recommendation</strong> — {finding.recommendation}
      </p>
    </div>
  );
}
