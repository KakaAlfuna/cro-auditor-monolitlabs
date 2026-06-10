import type { AuditFinding } from "./types/audit";

export interface OverallScoreInput {
  pageSpeedScore: number | null;
  totalColors: number;
  findings: AuditFinding[];
}

const PERFORMANCE_MAX = 30;
const COLOR_MAX = 20;
const UX_MAX = 50;
const UX_MIN = 10;
const UX_PENALTY_PER_WARNING = 6;
const COLOR_PENALTY_PER_EXTRA = 0.5;
const COLOR_PENALTY_CAP = 15;
const COLOR_THRESHOLD = 3;

function countWarnings(findings: AuditFinding[]): number {
  return findings.filter((finding) => finding.severity === "warning").length;
}

/**
 * Composite audit score (1–100):
 * - Performance (PageSpeed): up to 30 pts
 * - Color palette: up to 20 pts (penalized when >3 distinct colors)
 * - Framework UX warnings: up to 50 pts (−6 per warning, floor 10)
 */
export function computeOverallScore(input: OverallScoreInput): number {
  const { pageSpeedScore, totalColors, findings } = input;

  const performanceComponent =
    pageSpeedScore != null ? (pageSpeedScore / 100) * PERFORMANCE_MAX : 0;

  let colorComponent = COLOR_MAX;
  if (totalColors > COLOR_THRESHOLD) {
    const penalty = Math.min(
      (totalColors - COLOR_THRESHOLD) * COLOR_PENALTY_PER_EXTRA,
      COLOR_PENALTY_CAP
    );
    colorComponent -= penalty;
  }

  let uxComponent = UX_MAX;
  uxComponent -= countWarnings(findings) * UX_PENALTY_PER_WARNING;
  uxComponent = Math.max(uxComponent, UX_MIN);

  const overallScore = Math.round(
    performanceComponent + colorComponent + uxComponent
  );

  return Math.min(Math.max(overallScore, 1), 100);
}
