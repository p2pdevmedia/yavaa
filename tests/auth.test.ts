import { describe, expect, it } from 'vitest';

import { buildSignInPath, normalizeNextPath } from '@/lib/auth';

describe('auth helpers', () => {
  it('normalizes safe in-app next paths', () => {
    expect(normalizeNextPath('/dashboard')).toBe('/dashboard');
    expect(normalizeNextPath('/dashboard?tab=activity')).toBe('/dashboard?tab=activity');
  });

  it('falls back for invalid next paths', () => {
    expect(normalizeNextPath('https://example.com')).toBe('/dashboard');
    expect(normalizeNextPath('//example.com')).toBe('/dashboard');
    expect(normalizeNextPath('')).toBe('/dashboard');
  });

  it('builds the sign in redirect path safely', () => {
    expect(buildSignInPath('/dashboard')).toBe('/sign-in?next=%2Fdashboard');
    expect(buildSignInPath('https://example.com')).toBe('/sign-in?next=%2Fdashboard');
  });
});
