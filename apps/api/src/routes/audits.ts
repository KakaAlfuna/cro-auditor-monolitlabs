import type { AppContext } from "../context";
import type { AppConfig } from "../config";
import { requireAuth } from "../lib/auth";
import { getAuditById, listAudits } from "../services/supabase";
import { jsonResponse } from "../lib/http";

export async function handleListAudits(
  request: Request,
  origin: string,
  config: AppConfig,
  ctx: AppContext
): Promise<Response> {
  const authResult = await requireAuth(request, origin, config, ctx.supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 8), 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const { audits, hasMore } = await listAudits(
    ctx.supabase,
    authResult.user.id,
    limit,
    offset
  );

  return jsonResponse({ audits, pagination: { limit, offset, hasMore } }, 200, origin, config);
}

export async function handleGetAudit(
  request: Request,
  id: string,
  origin: string,
  config: AppConfig,
  ctx: AppContext
): Promise<Response> {
  const authResult = await requireAuth(request, origin, config, ctx.supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  const audit = await getAuditById(ctx.supabase, id, authResult.user.id);
  if (!audit) {
    return jsonResponse({ error: "Audit not found" }, 404, origin, config);
  }
  return jsonResponse({ audit }, 200, origin, config);
}
