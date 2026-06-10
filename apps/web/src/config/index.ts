const apiBase = import.meta.env.VITE_API_URL ?? "";

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const config = {
  apiBase,
  apiUrl: (path: string) => `${apiBase}${path}`,
  supabase: {
    url: requireEnv("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
    anonKey: requireEnv("VITE_SUPABASE_ANON_KEY", import.meta.env.VITE_SUPABASE_ANON_KEY),
  },
} as const;
