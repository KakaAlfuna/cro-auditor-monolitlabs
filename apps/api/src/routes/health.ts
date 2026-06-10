import type { AppConfig } from "../config";
import { jsonResponse } from "../lib/http";

export function handleHealth(origin: string, config: AppConfig): Response {
  return jsonResponse({ status: "ok" }, 200, origin, config);
}
