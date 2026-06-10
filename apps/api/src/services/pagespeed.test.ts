import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PAGE_SPEED_API_FIELDS,
  PAGE_SPEED_MAX_ATTEMPTS,
  PageSpeedFetchError,
  __testing,
  fetchPageSpeedMetrics,
} from "./pagespeed";

const { parsePageSpeedMetrics, successfulPageSpeedPayload } = __testing;

describe("fetchPageSpeedMetrics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns metrics on the first successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => successfulPageSpeedPayload(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const metrics = await fetchPageSpeedMetrics("https://example.com", "test-key");

    expect(metrics.performanceScore).toBe(72);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.searchParams.get("fields")).toBe(PAGE_SPEED_API_FIELDS);
    expect(requestUrl.searchParams.get("category")).toBe("performance");
  });

  it("retries retryable HTTP failures up to three attempts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      })
      .mockResolvedValue({
        ok: true,
        json: async () => successfulPageSpeedPayload(),
      });
    vi.stubGlobal("fetch", fetchMock);

    const metricsPromise = fetchPageSpeedMetrics("https://example.com", "test-key");
    await vi.runAllTimersAsync();
    const metrics = await metricsPromise;

    expect(metrics.performanceScore).toBe(72);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws after three failed attempts instead of continuing with empty metrics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const metricsPromise = fetchPageSpeedMetrics("https://example.com", "test-key");
    const expectation = expect(metricsPromise).rejects.toMatchObject({
      attempts: PAGE_SPEED_MAX_ATTEMPTS,
      message: "PageSpeed request failed (HTTP 503)",
    });
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fails immediately on non-retryable HTTP errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPageSpeedMetrics("https://example.com", "test-key")
    ).rejects.toMatchObject({
      attempts: 1,
      message: "PageSpeed request failed (HTTP 403)",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("parsePageSpeedMetrics", () => {
  it("extracts weighted performance metrics from audit refs", () => {
    const metrics = parsePageSpeedMetrics({
      lighthouseResult: {
        categories: {
          performance: {
            score: 0.85,
            auditRefs: [
              {
                id: "first-contentful-paint",
                acronym: "FCP",
                weight: 0.1,
                group: "metrics",
              },
              {
                id: "largest-contentful-paint",
                acronym: "LCP",
                weight: 0.25,
                group: "metrics",
              },
              {
                id: "cumulative-layout-shift",
                acronym: "CLS",
                weight: 0.25,
                group: "metrics",
              },
              {
                id: "total-blocking-time",
                acronym: "TBT",
                weight: 0.3,
                group: "metrics",
              },
              {
                id: "unused-css-rules",
                weight: 0.5,
                group: "diagnostics",
              },
            ],
          },
        },
        audits: {
          "first-contentful-paint": { score: 0.9, numericValue: 1200 },
          "largest-contentful-paint": { score: 0.8, numericValue: 2400 },
          "cumulative-layout-shift": { score: 1, numericValue: 0.042 },
          "total-blocking-time": { score: 0.7, numericValue: 310 },
        },
      },
    });

    expect(metrics.performanceScore).toBe(85);
    expect(metrics.labFcpMs).toBe(1200);
    expect(metrics.labLcpMs).toBe(2400);
    expect(metrics.labClsScore).toBe(0.042);
    expect(metrics.labTbtMs).toBe(310);
    expect(metrics.weightedLabMetrics).toEqual({
      FCP: { weight: 0.1, score: 90, value: 1200 },
      LCP: { weight: 0.25, score: 80, value: 2400 },
      CLS: { weight: 0.25, score: 100, value: 0.042 },
      TBT: { weight: 0.3, score: 70, value: 310 },
    });
  });

  it("falls back to direct audit values when weighted metrics are missing", () => {
    const metrics = parsePageSpeedMetrics({
      lighthouseResult: {
        categories: {
          performance: {
            score: 0.6,
            auditRefs: [],
          },
        },
        audits: {
          "largest-contentful-paint": { numericValue: 3500 },
          "first-contentful-paint": { numericValue: 1800 },
          "cumulative-layout-shift": { numericValue: 0.1567 },
          "total-blocking-time": { numericValue: 420 },
        },
      },
    });

    expect(metrics.performanceScore).toBe(60);
    expect(metrics.labLcpMs).toBe(3500);
    expect(metrics.labFcpMs).toBe(1800);
    expect(metrics.labClsScore).toBe(0.157);
    expect(metrics.labTbtMs).toBe(420);
    expect(metrics.weightedLabMetrics).toEqual({});
  });
});
