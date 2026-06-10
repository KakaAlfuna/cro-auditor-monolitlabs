import type { AppConfig } from "../config";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function parseAllowedOrigins(allowed: string): string[] {
  return allowed
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function resolveAllowedOrigin(origin: string, allowed: string): string | null {
  if (allowed === "*") {
    return origin || "*";
  }

  if (!origin) {
    return null;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const isAllowed = parseAllowedOrigins(allowed).includes(normalizedOrigin);
  return isAllowed ? origin : null;
}

export function corsHeaders(origin: string, config: AppConfig): Record<string, string> {
  const allowOrigin = resolveAllowedOrigin(origin, config.cors.allowedOrigin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}

export function jsonResponse(
  body: unknown,
  status: number,
  origin: string,
  config: AppConfig
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, config),
    },
  });
}

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
