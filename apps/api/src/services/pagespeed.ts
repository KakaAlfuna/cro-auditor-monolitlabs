export interface WeightedLabMetric {
  score: number;
  weight: number;
  value: number;
}

export interface WeightedPerformanceResult {
  performanceScore: number | null;
  metrics: Record<string, WeightedLabMetric>;
}

export interface EnhancedPageSpeedMetrics {
  performanceScore: number | null;
  weightedLabMetrics: Record<string, WeightedLabMetric>;
  labLcpMs: number | null;
  labFcpMs: number | null;
  labClsScore: number | null;
  labTbtMs: number | null;
}

export type PageSpeedMetrics = EnhancedPageSpeedMetrics;

interface LighthouseAudit {
  score?: number;
  numericValue?: number;
}

interface PerformanceAuditRef {
  id: string;
  weight?: number;
  group?: string;
  acronym?: string;
}

interface PageSpeedApiResponse {
  error?: {
    code?: number;
    message?: string;
  };
  lighthouseResult?: {
    categories?: {
      performance?: {
        score?: number;
        auditRefs?: PerformanceAuditRef[];
      };
    };
    audits?: Record<string, LighthouseAudit>;
  };
}

const CLS_AUDIT_ID = "cumulative-layout-shift";

// PageSpeed only supports field masks on paths in its REST schema. Top-level
// `error` is not maskable, and individual keys under `audits` cannot be
// addressed — request the whole `audits` map instead.
export const PAGE_SPEED_API_FIELDS = [
  "lighthouseResult/categories/performance/score",
  "lighthouseResult/categories/performance/auditRefs",
  "lighthouseResult/audits",
].join(",");

export const PAGE_SPEED_MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [1_000, 2_500];

export class PageSpeedFetchError extends Error {
  readonly attempts: number;

  constructor(message: string, attempts: number) {
    super(message);
    this.name = "PageSpeedFetchError";
    this.attempts = attempts;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatAuditValue(
  auditId: string,
  numericValue: number | undefined,
): number {
  if (numericValue == null) {
    return 0;
  }

  if (auditId === CLS_AUDIT_ID) {
    return parseFloat(numericValue.toFixed(3));
  }

  return Math.round(numericValue);
}

function parsePerformanceWithWeights(
  data: PageSpeedApiResponse,
): WeightedPerformanceResult {
  const lighthouse = data.lighthouseResult;
  const perfCategory = lighthouse?.categories?.performance;

  const totalScore =
    perfCategory?.score != null ? Math.round(perfCategory.score * 100) : null;

  const activeMetrics: Record<string, WeightedLabMetric> = {};

  for (const auditRef of perfCategory?.auditRefs ?? []) {
    if (
      auditRef.weight == null ||
      auditRef.weight <= 0 ||
      auditRef.group !== "metrics"
    ) {
      continue;
    }

    const auditDetail = lighthouse?.audits?.[auditRef.id];
    const acronym = auditRef.acronym || auditRef.id;

    activeMetrics[acronym] = {
      weight: auditRef.weight,
      score:
        auditDetail?.score != null ? Math.round(auditDetail.score * 100) : 0,
      value: formatAuditValue(auditRef.id, auditDetail?.numericValue),
    };
  }

  return {
    performanceScore: totalScore,
    metrics: activeMetrics,
  };
}

function metricValue(
  metrics: Record<string, WeightedLabMetric>,
  acronym: string,
): number | null {
  const metric = metrics[acronym];
  if (!metric) {
    return null;
  }

  return metric.value;
}

function parsePageSpeedMetrics(
  data: PageSpeedApiResponse,
): EnhancedPageSpeedMetrics {
  const weighted = parsePerformanceWithWeights(data);
  const lighthouse = data.lighthouseResult;

  const fallbackLcp =
    lighthouse?.audits?.["largest-contentful-paint"]?.numericValue;
  const fallbackFcp =
    lighthouse?.audits?.["first-contentful-paint"]?.numericValue;
  const fallbackCls = lighthouse?.audits?.[CLS_AUDIT_ID]?.numericValue;
  const fallbackTbt = lighthouse?.audits?.["total-blocking-time"]?.numericValue;

  return {
    performanceScore: weighted.performanceScore,
    weightedLabMetrics: weighted.metrics,
    labLcpMs:
      metricValue(weighted.metrics, "LCP") ??
      (fallbackLcp != null ? Math.round(fallbackLcp) : null),
    labFcpMs:
      metricValue(weighted.metrics, "FCP") ??
      (fallbackFcp != null ? Math.round(fallbackFcp) : null),
    labClsScore:
      metricValue(weighted.metrics, "CLS") ??
      (fallbackCls != null ? parseFloat(fallbackCls.toFixed(3)) : null),
    labTbtMs:
      metricValue(weighted.metrics, "TBT") ??
      (fallbackTbt != null ? Math.round(fallbackTbt) : null),
  };
}

function hasMetrics(metrics: EnhancedPageSpeedMetrics): boolean {
  return (
    metrics.performanceScore != null ||
    Object.keys(metrics.weightedLabMetrics).length > 0 ||
    metrics.labLcpMs != null ||
    metrics.labFcpMs != null ||
    metrics.labClsScore != null ||
    metrics.labTbtMs != null
  );
}

function successfulPageSpeedPayload(): PageSpeedApiResponse {
  return {
    lighthouseResult: {
      categories: {
        performance: {
          score: 0.72,
          auditRefs: [
            {
              id: "largest-contentful-paint",
              acronym: "LCP",
              weight: 0.25,
              group: "metrics",
            },
          ],
        },
      },
      audits: {
        "largest-contentful-paint": {
          score: 0.72,
          numericValue: 2400,
        },
      },
    },
  };
}

export async function fetchPageSpeedMetrics(
  url: string,
  apiKey: string,
): Promise<EnhancedPageSpeedMetrics> {
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  endpoint.searchParams.set("fields", PAGE_SPEED_API_FIELDS);
  endpoint.searchParams.set("key", apiKey);

  let lastErrorMessage = "PageSpeed returned no usable metrics";

  for (let attempt = 1; attempt <= PAGE_SPEED_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint.toString(), {
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) {
        console.error(response);
        lastErrorMessage = `PageSpeed request failed (HTTP ${response.status})`;

        if (
          RETRYABLE_STATUS_CODES.has(response.status) &&
          attempt < PAGE_SPEED_MAX_ATTEMPTS
        ) {
          await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2_500);
          continue;
        }

        throw new PageSpeedFetchError(lastErrorMessage, attempt);
      }

      const data = (await response.json()) as PageSpeedApiResponse;

      if (data.error?.message) {
        lastErrorMessage = `PageSpeed API error: ${data.error.message}`;

        if (attempt < PAGE_SPEED_MAX_ATTEMPTS) {
          await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2_500);
          continue;
        }

        throw new PageSpeedFetchError(lastErrorMessage, attempt);
      }

      const metrics = parsePageSpeedMetrics(data);
      if (hasMetrics(metrics)) {
        return metrics;
      }

      lastErrorMessage = "PageSpeed returned no usable metrics";
      if (attempt < PAGE_SPEED_MAX_ATTEMPTS) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2_500);
        continue;
      }
    } catch (error) {
      if (error instanceof PageSpeedFetchError) {
        throw error;
      }

      lastErrorMessage =
        error instanceof Error ? error.message : "PageSpeed request failed";

      if (attempt < PAGE_SPEED_MAX_ATTEMPTS) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2_500);
        continue;
      }
    }
  }

  throw new PageSpeedFetchError(
    `${lastErrorMessage} after ${PAGE_SPEED_MAX_ATTEMPTS} attempts`,
    PAGE_SPEED_MAX_ATTEMPTS,
  );
}

export const __testing = {
  parsePageSpeedMetrics,
  successfulPageSpeedPayload,
};
