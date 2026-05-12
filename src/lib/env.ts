import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).optional(),
    DIRECT_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional()
  })
  .passthrough();

export type AppEnv = z.infer<typeof envSchema>;

export type DatabaseEnvDiagnostics = {
  configured: boolean;
  host: string | null;
  port: string | null;
  database: string | null;
  provider: 'missing' | 'invalid' | 'local' | 'supabase-direct' | 'supabase-pooler' | 'other';
};

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

function classifyDatabaseHost(host: string): DatabaseEnvDiagnostics['provider'] {
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return 'local';
  }

  if (/^db\.[a-z0-9]+\.supabase\.co$/.test(host)) {
    return 'supabase-direct';
  }

  if (host.endsWith('.pooler.supabase.com')) {
    return 'supabase-pooler';
  }

  return 'other';
}

export function getDatabaseEnvDiagnostics(): DatabaseEnvDiagnostics {
  const databaseUrl = getEnv().DATABASE_URL;

  if (!databaseUrl) {
    return {
      configured: false,
      host: null,
      port: null,
      database: null,
      provider: 'missing'
    };
  }

  try {
    const parsed = new URL(databaseUrl);

    return {
      configured: true,
      host: parsed.hostname,
      port: parsed.port || null,
      database: parsed.pathname.replace(/^\//, '') || null,
      provider: classifyDatabaseHost(parsed.hostname)
    };
  } catch {
    return {
      configured: true,
      host: null,
      port: null,
      database: null,
      provider: 'invalid'
    };
  }
}

export function hasSupabaseEnv(): boolean {
  const env = getEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseUrl(): string {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }

  return env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string {
  const env = getEnv();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.');
  }

  return key;
}

export function hasSupabaseServiceRoleEnv(): boolean {
  return Boolean(getEnv().SUPABASE_SERVICE_ROLE_KEY);
}

export function hasVercelBlobEnv(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || getEnv().BLOB_READ_WRITE_TOKEN);
}
