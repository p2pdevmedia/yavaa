import { cookies } from 'next/headers';

import { hasSupabaseEnv } from '@/lib/env';
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type AuthSessionState = {
  authenticated: boolean;
  configured: boolean;
  user: {
    id: string;
    email: string | null;
  } | null;
};

export function hasSupabaseSessionCookie(cookieStore: Pick<CookieStore, 'getAll'>): boolean {
  return cookieStore.getAll().some((cookie) => cookie.name.startsWith('sb-'));
}

export function normalizeNextPath(nextPath: unknown, fallback = '/dashboard'): string {
  if (typeof nextPath !== 'string' || nextPath.trim().length === 0) {
    return fallback;
  }

  try {
    const normalized = new URL(nextPath, 'http://localhost');

    if (normalized.origin !== 'http://localhost') {
      return fallback;
    }

    if (!normalized.pathname.startsWith('/') || normalized.pathname.startsWith('//')) {
      return fallback;
    }

    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return fallback;
  }
}

export function buildSignInPath(nextPath: unknown): string {
  const safeNextPath = normalizeNextPath(nextPath);
  return `/sign-in?next=${encodeURIComponent(safeNextPath)}`;
}

export async function getAuthSessionState(cookieStore: CookieStore): Promise<AuthSessionState> {
  const configured = hasSupabaseEnv();

  if (!configured) {
    return {
      authenticated: hasSupabaseSessionCookie(cookieStore),
      configured: false,
      user: null
    };
  }

  const supabase = createSupabaseServerClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      authenticated: false,
      configured: true,
      user: null
    };
  }

  return {
    authenticated: true,
    configured: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? null
    }
  };
}
