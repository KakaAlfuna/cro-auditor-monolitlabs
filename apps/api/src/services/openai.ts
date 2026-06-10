import OpenAI from "openai";
import { computeOverallScore } from "@cro-auditor/shared/compute-overall-score";
import { CRO_AUDIT_RULES } from "@cro-auditor/shared/constants/rules";
import type { AuditAnalysis } from "@cro-auditor/shared/types/audit";
import type { PageSpeedMetrics } from "./pagespeed";
import type { ScrapeResult } from "../scraper";

export type { AuditAnalysis } from "@cro-auditor/shared/types/audit";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summaryOverview: { type: "string" },
    summaryStrengths: { type: "string" },
    summaryWeaknesses: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    issuesToFix: {
      type: "array",
      items: { type: "string" },
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ruleId: { type: "string" },
          title: { type: "string" },
          severity: { type: "string", enum: ["critical", "warning", "info"] },
          observation: { type: "string" },
          recommendation: { type: "string" },
        },
        required: ["ruleId", "title", "severity", "observation", "recommendation"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "summaryOverview",
    "summaryStrengths",
    "summaryWeaknesses",
    "strengths",
    "issuesToFix",
    "findings",
  ],
  additionalProperties: false,
} as const;

function formatWeightedMetrics(metrics: PageSpeedMetrics): string {
  const entries = Object.entries(metrics.weightedLabMetrics);
  if (entries.length === 0) {
    return "- No weighted lab metrics available";
  }

  return entries
    .map(([acronym, metric]) => {
      const unit = acronym === "CLS" ? "" : "ms";
      const valueLabel =
        acronym === "CLS" ? `${metric.value}` : `${metric.value}${unit}`;
      return `- ${acronym}: score ${metric.score}/100, weight ${Math.round(metric.weight * 100)}%, value ${valueLabel}`;
    })
    .join("\n");
}

function buildPrompt(scrape: ScrapeResult, metrics: PageSpeedMetrics): string {
  const { visualTokens } = scrape;
  const contentSection =
    scrape.semanticMarkdown.trim().length > 0
      ? scrape.semanticMarkdown.slice(0, 12000)
      : "(no static page content could be extracted)";

  return `You are a senior Conversion Rate Optimization (CRO) auditor. Analyze the website content and performance data below using ONLY the provided framework rules.

## Audit Framework
${CRO_AUDIT_RULES}

## Target URL
${scrape.url}

## Page Title
${scrape.title}

## Content Extraction Quality
- Quality: ${scrape.contentQuality.toUpperCase()}
- Note: This audit uses static HTML only (no JavaScript rendering). If quality is INSUFFICIENT or LIMITED, the page may be a client-rendered SPA and visible copy was not available to scrape.

## Performance Test Results (Mobile)

### Lab Data (Lighthouse)
- Performance Score: ${metrics.performanceScore ?? "unavailable"}/100
- Largest Contentful Paint (LCP): ${metrics.labLcpMs != null ? `${metrics.labLcpMs}ms` : "unavailable"}
- First Contentful Paint (FCP): ${metrics.labFcpMs != null ? `${metrics.labFcpMs}ms` : "unavailable"}
- Cumulative Layout Shift (CLS): ${metrics.labClsScore != null ? metrics.labClsScore : "unavailable"}
- Total Blocking Time (TBT): ${metrics.labTbtMs != null ? `${metrics.labTbtMs}ms` : "unavailable"}

#### Weighted lab metrics (Lighthouse scoring breakdown)
${formatWeightedMetrics(metrics)}

## Visual Design Tokens
- Distinct colors detected: ${visualTokens.total_colors}
- Color palette warning (>${3} colors): ${visualTokens.color_count_warning ? "YES - palette may be cluttered" : "No"}
- Colors: ${visualTokens.colors.join(", ") || "none detected"}
- Primary font family: ${visualTokens.primary_font_family ?? "unknown"}
- All font families: ${visualTokens.fontFamilies.join(", ") || "none detected"}

## Semantic Page Content (Markdown)
${contentSection}

## Instructions
1. Evaluate the page against each framework rule (KRUG-01 through KRUG-03, CIALDINI-01 through CIALDINI-03). Return one finding per rule in the \`findings\` array.
2. Reference concrete evidence from the semantic content and performance metrics when available.
3. If content quality is INSUFFICIENT or LIMITED, clearly state this limitation in summaryOverview. Do not assume missing copy means poor CRO — mark content-dependent findings as severity "info" and explain that JavaScript-rendered content could not be verified.
4. If performance metrics are unavailable, do not penalize performance-related observations; note the data gap instead.
5. Assign severity honestly: use "critical" for clear conversion blockers, "warning" for meaningful gaps, and "info" only when the rule is genuinely met or evidence is insufficient to judge.

## Output structure
- summaryOverview: 2-3 sentence executive summary of overall CRO health.
- summaryStrengths: Paragraph describing what the page does well (UX clarity, persuasion, performance, design).
- summaryWeaknesses: Paragraph describing the main gaps and risks hurting conversion.
- strengths: 3-6 concise bullet points of things already working well (actionable positives, not generic praise).
- issuesToFix: 3-6 concise bullet points of prioritized fixes the team should tackle (most impactful first).
- findings: Detailed per-rule analysis with observation and recommendation for each framework rule.

6. Return structured JSON only.`;
}

export async function analyzeWithOpenAI(
  apiKey: string,
  scrape: ScrapeResult,
  metrics: PageSpeedMetrics
): Promise<AuditAnalysis> {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cro_audit_analysis",
        strict: true,
        schema: ANALYSIS_SCHEMA,
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are an expert CRO auditor. Respond with valid JSON matching the schema. Be specific and actionable. Write all text in clear English.",
      },
      {
        role: "user",
        content: buildPrompt(scrape, metrics),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty analysis response");
  }

  const parsed = JSON.parse(content) as Omit<AuditAnalysis, "overallScore">;

  return {
    ...parsed,
    overallScore: computeOverallScore({
      pageSpeedScore: metrics.performanceScore,
      totalColors: scrape.visualTokens.total_colors,
      findings: parsed.findings,
    }),
  };
}
