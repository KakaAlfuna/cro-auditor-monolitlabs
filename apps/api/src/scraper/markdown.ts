import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

const SECTION_TAGS = new Set(["header", "nav", "main", "section", "article", "aside", "footer"]);

const TRANSACTIONAL_KEYWORDS = [
  "buy",
  "shop",
  "order",
  "signup",
  "sign up",
  "register",
  "subscribe",
  "get started",
  "start",
  "try",
  "download",
  "contact",
  "book",
  "checkout",
  "add to cart",
  "learn more",
  "join",
];

function isTransactionalLink($: CheerioAPI, element: Element): boolean {
  const href = $(element).attr("href") ?? "";
  const text = $(element).text().trim().toLowerCase();
  const className = ($(element).attr("class") ?? "").toLowerCase();

  if (/btn|button|cta|primary|action/.test(className)) {
    return true;
  }

  if (/signup|register|checkout|cart|pricing|contact|buy|order/.test(href)) {
    return true;
  }

  return TRANSACTIONAL_KEYWORDS.some((keyword) => text.includes(keyword));
}

function getSectionLabel(tagName: string): string {
  return tagName.toUpperCase();
}

function processNode($: CheerioAPI, element: Element, depth = 0): string {
  const tagName = element.tagName?.toLowerCase() ?? "";
  const $el = $(element);

  if (tagName === "script" || tagName === "style" || tagName === "svg" || tagName === "noscript") {
    return "";
  }

  if (tagName === "button") {
    const label = $el.text().trim() || $el.attr("aria-label") || "Untitled";
    return `[CTA Button: ${label}]`;
  }

  if (tagName === "a" && isTransactionalLink($, element)) {
    const label = $el.text().trim() || $el.attr("aria-label") || "Link";
    return `[CTA Button: ${label}]`;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Math.min(Number(tagName[1]), 3);
    const text = $el.text().trim();
    return text ? `${"#".repeat(level)} ${text}` : "";
  }

  if (tagName === "p") {
    const text = $el.text().trim();
    return text ? text : "";
  }

  if (tagName === "li") {
    const text = $el.text().trim();
    return text ? `- ${text}` : "";
  }

  if (tagName === "img") {
    const alt = $el.attr("alt")?.trim();
    return alt ? `[Image: ${alt}]` : "";
  }

  const childContent = $el
    .contents()
    .toArray()
    .map((child) => {
      if (child.type === "text") {
        const text = (child.data ?? "").replace(/\s+/g, " ").trim();
        return text;
      }
      if (child.type === "tag") {
        return processNode($, child as Element, depth + 1);
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  if (SECTION_TAGS.has(tagName) && childContent) {
    return `[SECTION: ${getSectionLabel(tagName)}]\n${childContent}`;
  }

  if (tagName === "div" || tagName === "span") {
    return childContent;
  }

  return childContent;
}

function extractFallbackMetadata($: CheerioAPI): string[] {
  const lines: string[] = [];

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim();
  if (metaDescription) {
    lines.push(`[Meta Description: ${metaDescription}]`);
  }

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  if (ogTitle) {
    lines.push(`[Open Graph Title: ${ogTitle}]`);
  }

  $("noscript")
    .toArray()
    .forEach((element) => {
      const text = $(element).text().replace(/\s+/g, " ").trim();
      if (text) {
        lines.push(`[Noscript Fallback: ${text.slice(0, 500)}]`);
      }
    });

  $('script[type="application/ld+json"]')
    .toArray()
    .forEach((element) => {
      const raw = $(element).html()?.trim();
      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const headline = typeof parsed.headline === "string" ? parsed.headline : null;
        const description = typeof parsed.description === "string" ? parsed.description : null;
        const name = typeof parsed.name === "string" ? parsed.name : null;

        if (headline) {
          lines.push(`[Structured Data Headline: ${headline}]`);
        }
        if (description) {
          lines.push(`[Structured Data Description: ${description}]`);
        }
        if (name && !headline) {
          lines.push(`[Structured Data Name: ${name}]`);
        }
      } catch {
        lines.push(`[Structured Data: ${raw.slice(0, 500)}]`);
      }
    });

  return lines;
}

function normalizeMarkdownBlock(block: string): string {
  return block.replace(/\s+/g, " ").trim().toLowerCase();
}

export function deduplicateMarkdownLines(markdown: string): string {
  const seen = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (uniqueLines.length > 0 && uniqueLines[uniqueLines.length - 1] !== "") {
        uniqueLines.push("");
      }
      continue;
    }

    const key = normalizeMarkdownBlock(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueLines.push(trimmed);
  }

  while (uniqueLines.length > 0 && uniqueLines[uniqueLines.length - 1] === "") {
    uniqueLines.pop();
  }

  return uniqueLines.join("\n");
}

export function htmlToSemanticMarkdown(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, svg").remove();
  $("[class]").each((_, el) => {
    $(el).removeAttr("class");
  });

  const rootNodes =
    $("body").length > 0 ? $("body").contents().toArray() : $.root().contents().toArray();
  const lines = rootNodes
    .map((node) => {
      if (node.type === "text") {
        const text = (node.data ?? "").replace(/\s+/g, " ").trim();
        return text;
      }
      if (node.type === "tag") {
        return processNode($, node as Element);
      }
      return "";
    })
    .filter(Boolean);

  const markdown = deduplicateMarkdownLines(
    lines
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );

  if (markdown.length >= 100) {
    return markdown;
  }

  const fallbackLines = extractFallbackMetadata($);
  if (fallbackLines.length === 0) {
    return markdown;
  }

  const fallbackBlock = `[Limited static HTML detected — metadata fallback]\n${fallbackLines.join("\n")}`;
  return markdown ? `${markdown}\n\n${fallbackBlock}` : fallbackBlock;
}
