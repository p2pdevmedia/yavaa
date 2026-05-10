import { describe, expect, it } from 'vitest';

import {
  buildAuthCallbackRedirectTo,
  buildAuthEmailRedirectTo,
  buildPasswordResetRedirectTo,
  buildRootAuthHashRedirectPath,
  buildRootAuthCodeRedirectPath,
  getAuthRedirectBaseUrl
} from '@/lib/auth-redirect';

describe('auth redirect helpers', () => {
  it('prefers the configured public site URL for auth emails', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: 'https://yavaa.lat/',
        windowOrigin: 'http://127.0.0.1:3000'
      })
    ).toBe('https://yavaa.lat');
  });

  it('falls back to the current browser origin when no public site URL is configured', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: undefined,
        windowOrigin: 'https://www.yavaa.lat'
      })
    ).toBe('https://www.yavaa.lat');
  });

  it('falls back to the current browser origin for local development', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: undefined,
        windowOrigin: 'http://127.0.0.1:3000'
      })
    ).toBe('http://127.0.0.1:3000');
  });

  it('builds the password reset redirect through the auth callback', () => {
    expect(buildPasswordResetRedirectTo('http://127.0.0.1:3000')).toBe(
      'http://127.0.0.1:3000/auth/callback?next=%2Freset-password'
    );
  });

  it('builds signup confirmation redirects through the auth callback', () => {
    expect(buildAuthEmailRedirectTo('/dashboard?tab=bookings', 'http://127.0.0.1:3000')).toBe(
      'http://127.0.0.1:3000/auth/callback?next=%2Fdashboard%3Ftab%3Dbookings'
    );
  });

  it('builds OAuth redirects through the auth callback', () => {
    expect(buildAuthCallbackRedirectTo('/providers', 'http://127.0.0.1:3000')).toBe(
      'http://127.0.0.1:3000/auth/callback?next=%2Fproviders'
    );
  });

  it('recovers Supabase PKCE auth codes that land on the site root', () => {
    expect(buildRootAuthCodeRedirectPath({ code: 'pkce-test-code' })).toBe(
      '/auth/callback?code=pkce-test-code&next=%2Freset-password'
    );
  });

  it('recovers Supabase implicit recovery links that land on the site root hash', () => {
    expect(
      buildRootAuthHashRedirectPath(
        '#access_token=recovery-access&refresh_token=recovery-refresh&type=recovery'
      )
    ).toBe('/reset-password#access_token=recovery-access&refresh_token=recovery-refresh&type=recovery');
  });
});
