import { config } from "../config";
import { supabase } from "./supabase";
import { consumeSSE } from "./sse";
import type { AuditRecord } from "@cro-auditor/shared/types/audit";
import type {
  AuditCompletePayload,
  AuditErrorPayload,
  AuditProgressPayload,
  AuditStreamEvent,
} from "@cro-auditor/shared/types/audit-stream";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You must be signed in to perform this action");
  }
  return token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(config.apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return data as T;
}

function mapSSEEvent(event: string, data: unknown): AuditStreamEvent {
  if (event === "complete") {
    return { type: "complete", data: data as AuditCompletePayload };
  }
  if (event === "error") {
    return { type: "error", data: data as AuditErrorPayload };
  }
  return { type: "progress", data: data as AuditProgressPayload };
}

export async function runAudit(
  url: string,
  onEvent: (event: AuditStreamEvent) => void
): Promise<AuditRecord> {
  const accessToken = await getAccessToken();
  const response = await fetch(config.apiUrl("/api/audit"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url }),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? `Request failed (${response.status})`);
    }
    throw new Error(`Request failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error("No response body received");
  }

  let audit: AuditRecord | null = null;
  let streamError: string | null = null;

  await consumeSSE(response.body, (event, data) => {
    const mapped = mapSSEEvent(event, data);
    onEvent(mapped);

    if (mapped.type === "complete") {
      audit = mapped.data.audit;
    }
    if (mapped.type === "error") {
      streamError = mapped.data.message;
    }
  });

  if (streamError) {
    throw new Error(streamError);
  }

  if (!audit) {
    throw new Error("Audit stream ended without a result");
  }

  return audit;
}

export interface FetchAuditsResult {
  audits: AuditRecord[];
  hasMore: boolean;
}

export async function fetchAudits(
  limit = 8,
  offset = 0
): Promise<FetchAuditsResult> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const data = await request<{
    audits: AuditRecord[];
    pagination: { limit: number; offset: number; hasMore: boolean };
  }>(`/api/audits?${params.toString()}`);
  return { audits: data.audits, hasMore: data.pagination.hasMore };
}

export async function fetchAuditById(id: string): Promise<AuditRecord> {
  const data = await request<{ audit: AuditRecord }>(`/api/audits/${id}`);
  return data.audit;
}
