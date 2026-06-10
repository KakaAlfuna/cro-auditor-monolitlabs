import { assertScrapeHasContent, scrapeUrl } from "../scraper";
import { analyzeWithOpenAI } from "../services/openai";
import { fetchPageSpeedMetrics } from "../services/pagespeed";
import { saveAudit } from "../services/supabase";
import type { AppContext } from "../context";
import type { AppConfig } from "../config";
import { requireAuth } from "../lib/auth";
import { isValidUrl, jsonResponse } from "../lib/http";
import { createSSEResponse } from "../lib/sse";

interface AuditRequestBody {
  url?: string;
}

export async function handleCreateAudit(
  request: Request,
  origin: string,
  config: AppConfig,
  ctx: AppContext
): Promise<Response> {
  const authResult = await requireAuth(request, origin, config, ctx.supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  const body = (await request.json()) as AuditRequestBody;
  const targetUrl = body.url?.trim();

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return jsonResponse(
      { error: "A valid http(s) URL is required" },
      400,
      origin,
      config
    );
  }

  return createSSEResponse(origin, config, async (send) => {
    send.send("progress", {
      step: "validating",
      message: "URL validated",
      status: "done",
    });

    send.send("progress", {
      step: "scraping",
      message: "Fetching and parsing page HTML…",
      status: "running",
    });
    send.send("progress", {
      step: "performance",
      message: "Testing page performance…",
      status: "running",
    });

    const scrapePromise = scrapeUrl(targetUrl).then((result) => {
      assertScrapeHasContent(result);
      send.send("progress", {
        step: "scraping",
        message: "Page scraped successfully",
        status: "done",
      });
      return result;
    });

    const metricsPromise = fetchPageSpeedMetrics(
      targetUrl,
      ctx.config.pagespeed.apiKey
    )
      .then((result) => {
        send.send("progress", {
          step: "performance",
          message: "Performance test complete",
          status: "done",
        });
        return result;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Performance test failed after 3 attempts";

        send.send("progress", {
          step: "performance",
          message,
          status: "error",
        });
        throw error;
      });

    const [scrape, metrics] = await Promise.all([scrapePromise, metricsPromise]);

    send.send("progress", {
      step: "analyzing",
      message: "Running AI CRO analysis…",
      status: "running",
    });

    const analysis = await analyzeWithOpenAI(ctx.config.openai.apiKey, scrape, metrics);

    send.send("progress", {
      step: "analyzing",
      message: "Analysis complete",
      status: "done",
    });

    send.send("progress", {
      step: "saving",
      message: "Saving audit report…",
      status: "running",
    });

    const audit = await saveAudit(
      ctx.supabase,
      authResult.user.id,
      scrape,
      metrics,
      analysis
    );

    send.send("progress", {
      step: "saving",
      message: "Report saved",
      status: "done",
    });

    send.send("complete", { audit });
    send.close();
  });
}
