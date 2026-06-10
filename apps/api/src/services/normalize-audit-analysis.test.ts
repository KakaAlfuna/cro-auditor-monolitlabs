import { describe, expect, it } from "vitest";
import { normalizeAuditAnalysis } from "@cro-auditor/shared/normalize-audit-analysis";
import type { AuditAnalysis } from "@cro-auditor/shared/types/audit";

describe("normalizeAuditAnalysis", () => {
  it("recomputes score from findings and audit metrics", () => {
    const analysis: AuditAnalysis = {
      overallScore: 72,
      summaryOverview: "Solid page with room to improve.",
      summaryStrengths: "Clear headline.",
      summaryWeaknesses: "Weak social proof.",
      strengths: ["Strong headline"],
      issuesToFix: ["Add testimonials"],
      findings: [
        {
          ruleId: "KRUG-01",
          title: "Self-evident design",
          severity: "warning",
          observation: "Intent is unclear.",
          recommendation: "Clarify the headline.",
        },
      ],
    };

    expect(
      normalizeAuditAnalysis(analysis, {
        pageSpeedScore: 28,
        totalColors: 61,
      })
    ).toEqual({
      ...analysis,
      overallScore: 57,
    });
  });

  it("maps legacy summary into overview and derives lists from findings", () => {
    const legacy: AuditAnalysis = {
      overallScore: 55,
      summary: "Legacy flat summary.",
      summaryOverview: "",
      summaryStrengths: "",
      summaryWeaknesses: "",
      strengths: [],
      issuesToFix: [],
      findings: [
        {
          ruleId: "KRUG-01",
          title: "Self-evident navigation",
          severity: "info",
          observation: "Navigation labels are clear.",
          recommendation: "Keep as is.",
        },
        {
          ruleId: "CIALDINI-01",
          title: "Social proof",
          severity: "critical",
          observation: "No testimonials visible.",
          recommendation: "Add customer reviews above the fold.",
        },
      ],
    };

    const normalized = normalizeAuditAnalysis(legacy, {
      pageSpeedScore: 80,
      totalColors: 2,
    });

    expect(normalized.overallScore).toBe(94);
    expect(normalized.summaryOverview).toBe("Legacy flat summary.");
    expect(normalized.strengths).toHaveLength(1);
    expect(normalized.issuesToFix).toHaveLength(1);
    expect(normalized.issuesToFix[0]).toContain("Add customer reviews");
  });
});
