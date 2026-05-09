import { describe, expect, it } from 'vitest';

import { buildPasswordResetRedirectTo, getAuthRedirectBaseUrl } from '@/lib/auth-redirect';

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
});
