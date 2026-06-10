import type { AuditAnalysis, AuditRecord } from "@cro-auditor/shared/types/audit";
import type { AppSupabaseClient } from "../context";
import type { PageSpeedMetrics } from "./pagespeed";
import type { ScrapeResult } from "../scraper";

export type { AuditRecord } from "@cro-auditor/shared/types/audit";

interface AuditInsertPayload {
  user_id: string;
  url: string;
  title: string;
  performance_score: number | null;
  lcp_ms: number | null;
  fcp_ms: number | null;
  lab_lcp_ms: number | null;
  lab_fcp_ms: number | null;
  lab_cls_score: number | null;
  lab_tbt_ms: number | null;
  total_colors: number;
  color_count_warning: boolean;
  colors: string[];
  font_families: string[];
  primary_font_family: string | null;
  semantic_markdown: string;
  analysis: AuditAnalysis;
}

export async function saveAudit(
  client: AppSupabaseClient,
  userId: string,
  scrape: ScrapeResult,
  metrics: PageSpeedMetrics,
  analysis: AuditAnalysis
) {
  const payload: AuditInsertPayload = {
    user_id: userId,
    url: scrape.url,
    title: scrape.title,
    performance_score: metrics.performanceScore,
    lcp_ms: metrics.labLcpMs,
    fcp_ms: metrics.labFcpMs,
    lab_lcp_ms: metrics.labLcpMs,
    lab_fcp_ms: metrics.labFcpMs,
    lab_cls_score: metrics.labClsScore,
    lab_tbt_ms: metrics.labTbtMs,
    total_colors: scrape.visualTokens.total_colors,
    color_count_warning: scrape.visualTokens.color_count_warning,
    colors: scrape.visualTokens.colors,
    font_families: scrape.visualTokens.fontFamilies,
    primary_font_family: scrape.visualTokens.primary_font_family,
    semantic_markdown: scrape.semanticMarkdown,
    analysis,
  };

  const { data, error } = await client.from("audits").insert(payload).select().single();

  if (error) {
    throw new Error(`Failed to save audit: ${error.message}`);
  }

  return data;
}

export interface AuditListResult {
  audits: AuditRecord[];
  hasMore: boolean;
}

export async function listAudits(
  client: AppSupabaseClient,
  userId: string,
  limit = 8,
  offset = 0
): Promise<AuditListResult> {
  const { data, error } = await client
    .from("audits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    throw new Error(`Failed to list audits: ${error.message}`);
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;

  return {
    audits: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
  };
}

export async function getAuditById(client: AppSupabaseClient, id: string, userId: string) {
  const { data, error } = await client
    .from("audits")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch audit: ${error.message}`);
  }

  return data;
}
