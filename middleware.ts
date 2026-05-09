import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return response;
  }

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'));

  if (hasSupabaseSessionCookie) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.searchParams.set('next', request.nextUrl.pathname);

  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
