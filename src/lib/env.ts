import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).optional(),
    DIRECT_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    OPENAPI_OUTPUT_PATH: z.string().min(1).default('public/openapi.json')
  })
  .passthrough();

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function hasDatabaseEnv(): boolean {
  return Boolean(getEnv().DATABASE_URL);
}

export function hasSupabaseEnv(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseServiceRoleEnv(): boolean {
  return Boolean(getEnv().SUPABASE_SERVICE_ROLE_KEY);
}
