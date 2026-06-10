import {
  computeOverallScore,
  type OverallScoreInput,
} from "./compute-overall-score";
import type { AuditAnalysis, AuditFinding } from "./types/audit";

export type AuditScoreContext = Pick<
  OverallScoreInput,
  "pageSpeedScore" | "totalColors"
>;

function deriveStrengthsFromFindings(findings: AuditFinding[]): string[] {
  return findings
    .filter((finding) => finding.severity === "info")
    .map((finding) => `${finding.title}: ${finding.observation}`);
}

function deriveIssuesFromFindings(findings: AuditFinding[]): string[] {
  return findings
    .filter((finding) => finding.severity === "critical" || finding.severity === "warning")
    .map((finding) => `${finding.title}: ${finding.recommendation}`);
}

function withComputedScore(
  analysis: AuditAnalysis,
  findings: AuditFinding[],
  scoreContext?: AuditScoreContext
): AuditAnalysis {
  return {
    ...analysis,
    findings,
    overallScore: computeOverallScore({
      pageSpeedScore: scoreContext?.pageSpeedScore ?? null,
      totalColors: scoreContext?.totalColors ?? 0,
      findings,
    }),
  };
}

/** Normalizes legacy audit payloads that only stored a flat `summary` string. */
export function normalizeAuditAnalysis(
  analysis: AuditAnalysis,
  scoreContext?: AuditScoreContext
): AuditAnalysis {
  const findings = analysis.findings ?? [];

  const hasStructuredSummary =
    Boolean(analysis.summaryOverview?.trim()) ||
    Boolean(analysis.summaryStrengths?.trim()) ||
    Boolean(analysis.summaryWeaknesses?.trim());

  if (hasStructuredSummary) {
    return withComputedScore(
      {
        ...analysis,
        strengths: analysis.strengths ?? [],
        issuesToFix: analysis.issuesToFix ?? [],
      },
      findings,
      scoreContext
    );
  }

  const legacySummary = analysis.summary?.trim() ?? "";
  const derivedStrengths = deriveStrengthsFromFindings(analysis.findings ?? []);
  const derivedIssues = deriveIssuesFromFindings(analysis.findings ?? []);

  return withComputedScore(
    {
      ...analysis,
      summaryOverview: legacySummary,
      summaryStrengths:
        derivedStrengths.length > 0
          ? "Strengths were inferred from framework findings marked as informational."
          : "",
      summaryWeaknesses:
        derivedIssues.length > 0
          ? "Areas to improve were inferred from critical and warning findings."
          : "",
      strengths: analysis.strengths?.length ? analysis.strengths : derivedStrengths,
      issuesToFix: analysis.issuesToFix?.length ? analysis.issuesToFix : derivedIssues,
    },
    findings,
    scoreContext
  );
}
