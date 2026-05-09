import { NextResponse } from 'next/server';

import { APP_NAME, APP_VERSION } from '@/lib/app-metadata';
import { getDatabaseEnvDiagnostics, hasDatabaseEnv, hasSupabaseEnv } from '@/lib/env';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      app: APP_NAME,
      version: APP_VERSION,
      configured: {
        database: hasDatabaseEnv(),
        supabase: hasSupabaseEnv()
      },
      diagnostics: {
        database: getDatabaseEnvDiagnostics(),
        deployment: {
          environment: process.env.VERCEL_ENV ?? null,
          url: process.env.VERCEL_URL ?? null,
          commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
          commitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
          nodeEnv: process.env.NODE_ENV ?? null
        }
      }
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}
