import type { CheerioAPI } from "cheerio";

const MAX_STYLESHEETS = 8;
const STYLESHEET_TIMEOUT_MS = 5_000;

const FETCH_HEADERS = {
  "User-Agent": "Monolitlabs-CRO-Auditor/1.0 (+https://monolitlabs.ai)",
  Accept: "text/css,*/*;q=0.1",
};

function resolveStylesheetUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchStylesheetText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(STYLESHEET_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/css") && !contentType.includes("text/plain")) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

export async function fetchLinkedStylesheets(
  $: CheerioAPI,
  pageUrl: string
): Promise<string[]> {
  const stylesheetUrls = $("link[rel='stylesheet'], link[rel=\"stylesheet\"]")
    .toArray()
    .map((element) => $(element).attr("href")?.trim())
    .filter((href): href is string => Boolean(href))
    .map((href) => resolveStylesheetUrl(href, pageUrl))
    .filter((url): url is string => Boolean(url));

  const uniqueUrls = [...new Set(stylesheetUrls)].slice(0, MAX_STYLESHEETS);
  const results = await Promise.all(uniqueUrls.map(fetchStylesheetText));

  return results.filter((text): text is string => Boolean(text));
}
