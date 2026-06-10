import * as cheerio from "cheerio";
import { assertPageIsNotBlocked } from "./blocked-page";
import { extractVisualTokens } from "./colors";
import { htmlToSemanticMarkdown } from "./markdown";
import { fetchLinkedStylesheets } from "./stylesheets";

export interface ScrapeResult {
  url: string;
  title: string;
  semanticMarkdown: string;
  contentQuality: "adequate" | "limited" | "insufficient";
  visualTokens: ReturnType<typeof extractVisualTokens>;
}

function assessContentQuality(markdown: string): ScrapeResult["contentQuality"] {
  const length = markdown.trim().length;
  if (length < 100) {
    return "insufficient";
  }
  if (length < 500) {
    return "limited";
  }
  return "adequate";
}

export function assertScrapeHasContent(scrape: ScrapeResult): void {
  if (scrape.semanticMarkdown.trim().length === 0) {
    throw new Error(
      "No page content could be extracted. This page may require JavaScript to render visible content, which this auditor does not support."
    );
  }
}

export async function scrapeUrl(targetUrl: string): Promise<ScrapeResult> {
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Monolitlabs-CRO-Auditor/1.0 (+https://monolitlabs.ai)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status}): ${targetUrl}`);
  }

  const html = await response.text();
  assertPageIsNotBlocked(html);

  const $ = cheerio.load(html);

  const styleTexts = $("style")
    .toArray()
    .map((el) => $(el).html() ?? "");

  const inlineStyles = $("[style]")
    .toArray()
    .map((el) => $(el).attr("style") ?? "");

  const externalStyles = await fetchLinkedStylesheets($, targetUrl);
  const visualTokens = extractVisualTokens(html, styleTexts, inlineStyles, externalStyles);
  const semanticMarkdown = htmlToSemanticMarkdown(html);
  const title = $("title").first().text().trim() || targetUrl;

  return {
    url: targetUrl,
    title,
    semanticMarkdown,
    contentQuality: assessContentQuality(semanticMarkdown),
    visualTokens,
  };
}
