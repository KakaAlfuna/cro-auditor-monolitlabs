import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "./config";

export type AppSupabaseClient = SupabaseClient<any, any, string>;

export interface AppContext {
  config: AppConfig;
  supabase: AppSupabaseClient;
}

export function createAppContext(config: AppConfig): AppContext {
  return {
    config,
    supabase: createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: config.supabase.dbSchema },
      },
    ),
  };
}
