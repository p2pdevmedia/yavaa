import { describe, expect, it } from 'vitest';

import { getAuthRedirectBaseUrl } from '@/lib/auth-redirect';

describe('auth redirect helpers', () => {
  it('prefers the configured public site URL for auth emails', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: 'https://yavaa.lat/',
        vercelUrl: undefined,
        windowOrigin: 'http://127.0.0.1:3000'
      })
    ).toBe('https://yavaa.lat');
  });

  it('normalizes Vercel deployment URLs when no public site URL is configured', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: undefined,
        vercelUrl: 'yavaa-preview.vercel.app',
        windowOrigin: 'http://127.0.0.1:3000'
      })
    ).toBe('https://yavaa-preview.vercel.app');
  });

  it('falls back to the current browser origin for local development', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: undefined,
        vercelUrl: undefined,
        windowOrigin: 'http://127.0.0.1:3000'
      })
    ).toBe('http://127.0.0.1:3000');
  });
});
