import { describe, expect, it } from 'vitest';

import {
  buildAuthErrorMessage,
  buildAuthErrorRedirectPath,
  hasAuthErrorParams
} from '@/lib/auth-errors';

describe('auth error helpers', () => {
  it('detects Supabase auth errors from query params', () => {
    expect(hasAuthErrorParams({ error: 'access_denied' })).toBe(true);
    expect(hasAuthErrorParams({ error_code: 'otp_expired' })).toBe(true);
    expect(hasAuthErrorParams({})).toBe(false);
  });

  it('maps expired recovery links to a user-actionable message', () => {
    expect(
      buildAuthErrorMessage({
        error: 'access_denied',
        error_code: 'otp_expired',
        error_description: 'Email link is invalid or has expired'
      })
    ).toBe('El enlace de recuperación venció o ya fue usado. Pedí uno nuevo para cambiar tu contraseña.');
  });

  it('builds a forgot-password redirect that preserves the safe message', () => {
    expect(
      buildAuthErrorRedirectPath({
        error: 'access_denied',
        error_code: 'otp_expired',
        error_description: 'Email link is invalid or has expired'
      })
    ).toBe(
      '/forgot-password?authError=El+enlace+de+recuperaci%C3%B3n+venci%C3%B3+o+ya+fue+usado.+Ped%C3%AD+uno+nuevo+para+cambiar+tu+contrase%C3%B1a.'
    );
  });
});
