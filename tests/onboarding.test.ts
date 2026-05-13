import { describe, expect, it } from 'vitest';

import {
  getPostOnboardingDashboardPath,
  getRequiredOnboardingPath,
  hasCompletedOnboarding,
  isOnboardingMode,
  jefeOnboardingSchema,
  workerOnboardingSchema
} from '@/lib/onboarding';

describe('onboarding helpers', () => {
  it('recognizes only supported onboarding modes', () => {
    expect(isOnboardingMode('jefe')).toBe(true);
    expect(isOnboardingMode('trabajador')).toBe(true);
    expect(isOnboardingMode('admin')).toBe(false);
  });

  it('resolves required onboarding and post-onboarding paths', () => {
    expect(getRequiredOnboardingPath('jefe')).toBe('/dashboard/onboarding/jefe');
    expect(getRequiredOnboardingPath('trabajador')).toBe('/dashboard/onboarding/trabajador');
    expect(getPostOnboardingDashboardPath('jefe')).toBe('/dashboard/jefe');
    expect(getPostOnboardingDashboardPath('trabajador')).toBe('/dashboard/trabajador');
  });

  it('checks completion independently per profile mode', () => {
    expect(hasCompletedOnboarding(null, 'jefe')).toBe(false);
    expect(
      hasCompletedOnboarding(
        {
          workerOnboardingCompletedAt: null,
          jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z')
        },
        'jefe'
      )
    ).toBe(true);
    expect(
      hasCompletedOnboarding(
        {
          workerOnboardingCompletedAt: null,
          jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z')
        },
        'trabajador'
      )
    ).toBe(false);
  });

  it('validates worker onboarding payloads with hourly price, categories and optional private avatar blob path', () => {
    const result = workerOnboardingSchema.safeParse({
      firstName: 'Ana',
      lastName: 'Gomez',
      dniNumber: '30123456',
      addressText: 'Salta Capital',
      workerCategories: ['cleaning', 'painting'],
      hourlyRatePesos: 4500,
      avatarBlobPath: 'profiles/user_001/avatars/avatar.jpg'
    });

    expect(result.success).toBe(true);
  });

  it('rejects incomplete worker onboarding payloads', () => {
    const result = workerOnboardingSchema.safeParse({
      firstName: 'Ana',
      lastName: 'Gomez',
      dniNumber: 'abc',
      addressText: 'Salta Capital',
      workerCategories: [],
      hourlyRatePesos: 0
    });

    expect(result.success).toBe(false);
  });

  it('validates jefe onboarding payloads with optional private avatar blob path', () => {
    const result = jefeOnboardingSchema.safeParse({
      firstName: 'Martin',
      lastName: 'Ruiz',
      addressText: 'Salta Capital',
      avatarBlobPath: 'profiles/user_001/avatars/avatar.jpg'
    });

    expect(result.success).toBe(true);
  });
});
