import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { type NextRequest } from 'next/server';

import { normalizeNextPath } from '@/lib/auth';
import { hasSupabaseEnv } from '@/lib/env';
import { createClient } from '@/utils/supabase/server';

function appendErrorParam(path: string, message: string): string {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set('authError', message);

  return `${url.pathname}${url.search}${url.hash}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = normalizeNextPath(requestUrl.searchParams.get('next'));

  if (!hasSupabaseEnv()) {
    redirect(appendErrorParam(nextPath, 'Supabase no está configurado en este entorno.') as Route);
  }

  if (!code) {
    redirect(appendErrorParam(nextPath, 'El enlace de recuperación no es válido o expiró.') as Route);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(appendErrorParam(nextPath, 'El enlace de recuperación no es válido o expiró.') as Route);
  }

  redirect(nextPath as Route);
}
