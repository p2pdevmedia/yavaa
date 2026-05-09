import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabasePublishableKey, getSupabaseUrl, getEnv, hasSupabaseEnv } from '@/lib/env';

export type SupabaseDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

let anonClient: SupabaseClient<SupabaseDatabase> | null = null;
let serviceClient: SupabaseClient<SupabaseDatabase> | null = null;

function getSupabaseServiceRoleKey(): string {
  const env = getEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSupabaseAnonClient(): SupabaseClient<SupabaseDatabase> {
  if (!anonClient) {
    anonClient = createClient<SupabaseDatabase>(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return anonClient;
}

export function getSupabaseServiceClient(): SupabaseClient<SupabaseDatabase> {
  if (!serviceClient) {
    serviceClient = createClient<SupabaseDatabase>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return serviceClient;
}

export async function verifySupabaseBearerToken(
  accessToken: string
): Promise<
  | {
      authenticated: false;
      configured: boolean;
      user: null;
      reason: 'missing-token' | 'supabase-not-configured' | 'invalid-token';
    }
  | {
      authenticated: true;
      configured: true;
      user: {
        id: string;
        email: string | null;
      };
      reason: null;
    }
> {
  if (!accessToken) {
    return {
      authenticated: false,
      configured: hasSupabaseEnv(),
      user: null,
      reason: 'missing-token'
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      authenticated: false,
      configured: false,
      user: null,
      reason: 'supabase-not-configured'
    };
  }

  const { data, error } = await getSupabaseAnonClient().auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      authenticated: false,
      configured: true,
      user: null,
      reason: 'invalid-token'
    };
  }

  return {
    authenticated: true,
    configured: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? null
    },
    reason: null
  };
}
