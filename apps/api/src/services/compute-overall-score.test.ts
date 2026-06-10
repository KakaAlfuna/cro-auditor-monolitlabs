import { describe, expect, it } from "vitest";
import { computeOverallScore } from "@cro-auditor/shared/compute-overall-score";
import type { AuditFinding } from "@cro-auditor/shared/types/audit";

function finding(
  ruleId: string,
  severity: AuditFinding["severity"]
): AuditFinding {
  return {
    ruleId,
    title: "Test rule",
    severity,
    observation: "obs",
    recommendation: "rec",
  };
}

describe("computeOverallScore", () => {
  it("scores a monolitlabs-like audit in the low 40s", () => {
    expect(
      computeOverallScore({
        pageSpeedScore: 28,
        totalColors: 61,
        findings: [
          finding("KRUG-01", "warning"),
          finding("KRUG-02", "warning"),
          finding("KRUG-03", "warning"),
          finding("CIALDINI-01", "info"),
          finding("CIALDINI-02", "info"),
          finding("CIALDINI-03", "info"),
        ],
      })
    ).toBe(45);
  });

  it("returns a strong score when performance, colors, and warnings are healthy", () => {
    expect(
      computeOverallScore({
        pageSpeedScore: 92,
        totalColors: 3,
        findings: [
          finding("KRUG-01", "info"),
          finding("KRUG-02", "info"),
          finding("KRUG-03", "info"),
        ],
      })
    ).toBe(98);
  });

  it("caps color penalty at 15 points once palette is cluttered enough", () => {
    const cluttered = computeOverallScore({
      pageSpeedScore: 100,
      totalColors: 100,
      findings: [],
    });
    const moderate = computeOverallScore({
      pageSpeedScore: 100,
      totalColors: 10,
      findings: [],
    });

    expect(cluttered).toBe(85);
    expect(moderate).toBe(97);
  });

  it("floors the UX component at 10 points", () => {
    expect(
      computeOverallScore({
        pageSpeedScore: 0,
        totalColors: 0,
        findings: Array.from({ length: 8 }, () => finding("KRUG-01", "warning")),
      })
    ).toBe(30);
  });

  it("ignores critical findings for UX warning penalties", () => {
    expect(
      computeOverallScore({
        pageSpeedScore: null,
        totalColors: 0,
        findings: [finding("CIALDINI-01", "critical")],
      })
    ).toBe(70);
  });

  it("clamps the final score between 1 and 100", () => {
    expect(
      computeOverallScore({
        pageSpeedScore: 100,
        totalColors: 3,
        findings: [],
      })
    ).toBe(100);

    expect(
      computeOverallScore({
        pageSpeedScore: 0,
        totalColors: 100,
        findings: Array.from({ length: 10 }, () => finding("KRUG-01", "warning")),
      })
    ).toBe(15);
  });
});
