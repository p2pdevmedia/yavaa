import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';

import { hasSupabaseEnv, getSupabasePublishableKey, getSupabaseUrl } from '@/lib/env';
import { resolveAppUser, type AppUserIdentity, type ResolvedAppUser } from '@/lib/app-user';
import { verifySupabaseBearerToken } from '@/lib/supabase';

export type RequestAuthState =
  | {
      authenticated: false;
      configured: boolean;
      reason: 'missing-token' | 'supabase-not-configured' | 'invalid-token';
      identity: null;
      appUser: null;
      matchedBy: null;
      permissionContext: null;
    }
  | {
      authenticated: true;
      configured: true;
      reason: null;
      identity: {
        id: string;
        email: string | null;
      };
      appUser: ResolvedAppUser['user'];
      matchedBy: ResolvedAppUser['matchedBy'];
      permissionContext: ResolvedAppUser['permissionContext'];
    };

function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length);
}

async function verifySupabaseCookieSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return {
      authenticated: false,
      configured: false,
      user: null
    };
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {}
    }
  });

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

export async function resolveRequestAuth(request: NextRequest): Promise<RequestAuthState> {
  const bearerToken = getBearerToken(request);
  const session = bearerToken
    ? await verifySupabaseBearerToken(bearerToken)
    : await verifySupabaseCookieSession(request);

  if (!session.authenticated) {
    return {
      authenticated: false,
      configured: session.configured,
      reason: bearerToken ? 'invalid-token' : 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    };
  }

  const identity = session.user as AppUserIdentity;
  const appUser = await resolveAppUser(identity);

  return {
    authenticated: true,
    configured: true,
    reason: null,
    identity,
    appUser: appUser.user,
    matchedBy: appUser.matchedBy,
    permissionContext: appUser.permissionContext
  };
}
