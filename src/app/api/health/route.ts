import { NextResponse } from 'next/server';

import { APP_NAME, APP_VERSION } from '@/lib/app-metadata';
import { hasDatabaseEnv, hasSupabaseEnv } from '@/lib/env';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      app: APP_NAME,
      version: APP_VERSION,
      configured: {
        database: hasDatabaseEnv(),
        supabase: hasSupabaseEnv()
      }
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}
