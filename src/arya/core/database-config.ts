export interface PersistenceConfig {
  provider: "supabase" | "neon" | "memory";
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  timeoutMs?: number;
}

/** Read server-only environment values. Do not call this from client modules. */
export function persistenceConfigFromEnv(env: Record<string, string | undefined> = process.env): PersistenceConfig {
  const provider = env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_URL ? "supabase" : "memory";
  return {
    provider,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    timeoutMs: env.PERSISTENCE_TIMEOUT_MS ? Number(env.PERSISTENCE_TIMEOUT_MS) : 8_000,
  };
}
