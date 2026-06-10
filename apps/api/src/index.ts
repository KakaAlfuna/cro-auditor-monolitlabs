import { createAppConfig, type WorkerEnv } from "./config";
import { createAppContext } from "./context";
import { corsHeaders } from "./lib/http";
import { handleCreateAudit } from "./routes/audit";
import { handleGetAudit, handleListAudits } from "./routes/audits";
import { handleHealth } from "./routes/health";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const config = createAppConfig(env);
    const ctx = createAppContext(config);
    const origin = request.headers.get("Origin") ?? "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, config),
      });
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        return handleHealth(origin, config);
      }

      if (request.method === "GET" && url.pathname === "/api/audits") {
        return handleListAudits(request, origin, config, ctx);
      }

      const auditIdMatch = url.pathname.match(/^\/api\/audits\/([0-9a-f-]+)$/i);
      if (request.method === "GET" && auditIdMatch) {
        return handleGetAudit(request, auditIdMatch[1], origin, config, ctx);
      }

      if (request.method === "POST" && url.pathname === "/api/audit") {
        return handleCreateAudit(request, origin, config, ctx);
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin, config),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin, config),
        },
      });
    }
  },
};
