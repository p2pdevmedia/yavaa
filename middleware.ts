import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { buildSignInPath, hasSupabaseSessionCookie } from '@/lib/auth';
import { getSupabasePublishableKey, getSupabaseUrl, hasSupabaseEnv } from '@/lib/env';

function isProtectedRoute(request: NextRequest): boolean {
  return request.nextUrl.pathname.startsWith('/dashboard');
}

function hasPlaywrightE2eSession(request: NextRequest): boolean {
  return process.env.PLAYWRIGHT_E2E === '1' && Boolean(request.cookies.get('yavaa-test-email')?.value);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  if (hasPlaywrightE2eSession(request)) {
    return response;
  }

  if (!hasSupabaseEnv()) {
    if (isProtectedRoute(request) && !hasSupabaseSessionCookie(request.cookies)) {
      return NextResponse.redirect(new URL(buildSignInPath(request.nextUrl.pathname), request.url));
    }

    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { data } = await supabase.auth.getUser();

  if (isProtectedRoute(request) && !data.user) {
    return NextResponse.redirect(new URL(buildSignInPath(request.nextUrl.pathname), request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)']
};
