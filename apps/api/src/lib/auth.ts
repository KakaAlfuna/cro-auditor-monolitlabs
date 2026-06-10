import type { User } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "../context";
import type { AppConfig } from "../config";
import { jsonResponse } from "./http";

export interface AuthResult {
  user: User;
  accessToken: string;
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function verifyAuthToken(
  supabase: AppSupabaseClient,
  accessToken: string
): Promise<AuthResult | null> {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return { user: data.user, accessToken };
}

export async function requireAuth(
  request: Request,
  origin: string,
  config: AppConfig,
  supabase: AppSupabaseClient
): Promise<AuthResult | Response> {
  const token = extractBearerToken(request);
  if (!token) {
    return jsonResponse({ error: "Authentication required" }, 401, origin, config);
  }

  const auth = await verifyAuthToken(supabase, token);
  if (!auth) {
    return jsonResponse({ error: "Invalid or expired session" }, 401, origin, config);
  }

  return auth;
}
