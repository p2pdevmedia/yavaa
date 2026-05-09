import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { type NextRequest } from 'next/server';

import { normalizeNextPath } from '@/lib/auth';
import { hasSupabaseEnv } from '@/lib/env';
import { createClient } from '@/utils/supabase/server';

function buildSignInErrorPath(nextPath: string, message: string): string {
  const url = new URL('/sign-in', 'http://localhost');
  url.searchParams.set('next', nextPath);
  url.searchParams.set('authError', message);

  return `${url.pathname}${url.search}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = normalizeNextPath(requestUrl.searchParams.get('next'));
  const providerError = requestUrl.searchParams.get('error') ?? requestUrl.searchParams.get('error_description');

  if (!hasSupabaseEnv()) {
    redirect(buildSignInErrorPath(nextPath, 'Supabase no está configurado en este entorno.') as Route);
  }

  if (providerError || !code) {
    redirect(buildSignInErrorPath(nextPath, 'No pudimos completar la autenticación con Google.') as Route);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(buildSignInErrorPath(nextPath, 'No pudimos completar la autenticación con Supabase.') as Route);
  }

  redirect(nextPath as Route);
}
