import { describe, expect, it } from 'vitest';

import { buildSignInPath, normalizeNextPath } from '@/lib/auth';

describe('auth helpers', () => {
  it('defaults auth redirects to profile selection', () => {
    expect(normalizeNextPath(undefined)).toBe('/dashboard/seleccionar-modo');
  });

  it('normalizes safe in-app next paths', () => {
    expect(normalizeNextPath('/dashboard')).toBe('/dashboard');
    expect(normalizeNextPath('/dashboard?tab=activity')).toBe('/dashboard?tab=activity');
  });

  it('falls back for invalid next paths', () => {
    expect(normalizeNextPath('https://example.com')).toBe('/dashboard/seleccionar-modo');
    expect(normalizeNextPath('//example.com')).toBe('/dashboard/seleccionar-modo');
    expect(normalizeNextPath('')).toBe('/dashboard/seleccionar-modo');
  });

  it('builds the sign in redirect path safely', () => {
    expect(buildSignInPath('/dashboard')).toBe('/sign-in?next=%2Fdashboard');
    expect(buildSignInPath('https://example.com')).toBe(
      '/sign-in?next=%2Fdashboard%2Fseleccionar-modo'
    );
  });
});
