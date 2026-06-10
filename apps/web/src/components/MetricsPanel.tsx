import { Tooltip } from "./ui/Tooltip";

interface MetricsPanelProps {
  performanceScore: number | null;
  labLcpMs: number | null;
  labFcpMs: number | null;
  labClsScore: number | null;
  labTbtMs: number | null;
  primaryFont: string | null;
}

const METRIC_TOOLTIPS = {
  performance:
    "Overall Lighthouse performance score (0–100). Higher means faster page load and better user experience.",
  font: "Primary typeface detected on the audited page. Font choice affects readability and brand consistency.",
  labGroup:
    "Synthetic lab measurements from Lighthouse in a controlled environment, not real-user data.",
  lcp: "Largest Contentful Paint — time until the largest content element is visible. Good: ≤2.5s.",
  fcp: "First Contentful Paint — time until the first text or image appears. Good: ≤1.8s.",
  cls: "Cumulative Layout Shift — measures unexpected layout movement. Good: ≤0.1.",
  tbt: "Total Blocking Time — how long the main thread was blocked. Good: ≤200ms.",
} as const;

function formatMs(value: number | null): string {
  if (value == null) return "—";
  return `${(value / 1000).toFixed(2)}s`;
}

function formatCls(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(3);
}

export function MetricsPanel({
  performanceScore,
  labLcpMs,
  labFcpMs,
  labClsScore,
  labTbtMs,
  primaryFont,
}: MetricsPanelProps) {
  return (
    <div className="ds-metrics-stack">
      <div className="ds-metrics-row">
        <MetricCard
          label="Performance"
          tooltip={METRIC_TOOLTIPS.performance}
          value={performanceScore != null ? `${performanceScore}` : "—"}
          unit={performanceScore != null ? "/100" : undefined}
        />
        <MetricCard
          label="Font"
          tooltip={METRIC_TOOLTIPS.font}
          value={primaryFont ?? "—"}
          small
        />
      </div>

      <div className="ds-metrics-group">
        <span className="ds-metrics-group__label">
          Lab (Lighthouse)
          <Tooltip content={METRIC_TOOLTIPS.labGroup} label="About lab metrics" />
        </span>
        <div className="ds-metrics-row">
          <MetricCard label="LCP" tooltip={METRIC_TOOLTIPS.lcp} tooltipAlign="start" value={formatMs(labLcpMs)} />
          <MetricCard label="FCP" tooltip={METRIC_TOOLTIPS.fcp} tooltipAlign="start" value={formatMs(labFcpMs)} />
          <MetricCard label="CLS" tooltip={METRIC_TOOLTIPS.cls} tooltipAlign="end" value={formatCls(labClsScore)} />
          <MetricCard label="TBT" tooltip={METRIC_TOOLTIPS.tbt} tooltipAlign="end" value={formatMs(labTbtMs)} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  tooltip,
  tooltipAlign = "start",
  value,
  unit,
  small,
}: {
  label: string;
  tooltip: string;
  tooltipAlign?: "start" | "center" | "end";
  value: string;
  unit?: string;
  small?: boolean;
}) {
  return (
    <div className="ds-metric-card">
      <span className="ds-metric-card__label">
        {label}
        <Tooltip content={tooltip} label={`About ${label}`} align={tooltipAlign} />
      </span>
      <strong
        className="ds-metric-card__value"
        style={small ? { fontSize: "var(--text-sm)" } : undefined}
      >
        {value}
        {unit && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {unit}
          </span>
        )}
      </strong>
    </div>
  );
}
