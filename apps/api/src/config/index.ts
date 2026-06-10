export const DEFAULT_SUPABASE_DB_SCHEMA = "cro_auditor";

export interface WorkerEnv {
  OPENAI_API_KEY: string;
  PAGESPEED_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_DB_SCHEMA?: string;
  ALLOWED_ORIGIN: string;
}

export interface AppConfig {
  openai: { apiKey: string };
  pagespeed: { apiKey: string };
  supabase: { url: string; anonKey: string; serviceRoleKey: string; dbSchema: string };
  cors: { allowedOrigin: string };
}

export function createAppConfig(env: WorkerEnv): AppConfig {
  return {
    openai: { apiKey: env.OPENAI_API_KEY },
    pagespeed: { apiKey: env.PAGESPEED_API_KEY },
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      dbSchema: env.SUPABASE_DB_SCHEMA?.trim() || DEFAULT_SUPABASE_DB_SCHEMA,
    },
    cors: { allowedOrigin: env.ALLOWED_ORIGIN || "*" },
  };
}
