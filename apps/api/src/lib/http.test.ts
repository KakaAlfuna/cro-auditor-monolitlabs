import { describe, expect, it } from "vitest";
import type { AppConfig } from "../config";
import { corsHeaders } from "./http";

const config = (allowedOrigin: string): AppConfig => ({
  openai: { apiKey: "test" },
  pagespeed: { apiKey: "test" },
  supabase: {
    url: "https://example.supabase.co",
    anonKey: "anon",
    serviceRoleKey: "service",
    dbSchema: "cro_auditor",
  },
  cors: { allowedOrigin },
});

describe("corsHeaders", () => {
  it("returns a single matching origin from a comma-separated allow list", () => {
    const headers = corsHeaders(
      "https://cro-auditor-web.pages.dev",
      config("http://localhost:5173,https://cro-auditor-web.pages.dev/")
    );

    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://cro-auditor-web.pages.dev"
    );
  });

  it("omits allow-origin when the request origin is not allowed", () => {
    const headers = corsHeaders(
      "https://evil.example",
      config("http://localhost:5173,https://cro-auditor-web.pages.dev")
    );

    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("allows any origin when configured with *", () => {
    const headers = corsHeaders("https://any.example", config("*"));

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://any.example");
  });
});
