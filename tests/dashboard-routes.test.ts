import { describe, expect, it } from 'vitest';

import {
  getDashboardHomePath,
  getModeSelectionPath,
  getNextDashboardPathForMode,
  getOnboardingPath
} from '@/lib/dashboard-routes';

describe('dashboard routes', () => {
  it('keeps mode selection inside the profile selection screen', () => {
    expect(getModeSelectionPath('jefe')).toBe('/dashboard/seleccionar-modo?perfil=jefe');
    expect(getModeSelectionPath('trabajador')).toBe('/dashboard/seleccionar-modo?perfil=trabajador');
  });

  it('resolves onboarding and post-onboarding home paths per mode', () => {
    expect(getOnboardingPath('jefe')).toBe('/dashboard/onboarding/jefe');
    expect(getOnboardingPath('trabajador')).toBe('/dashboard/onboarding/trabajador');
    expect(getDashboardHomePath('jefe')).toBe('/dashboard/jefe');
    expect(getDashboardHomePath('trabajador')).toBe('/dashboard/trabajador');
  });

  it('routes selected modes to onboarding until the matching wizard is complete', () => {
    expect(
      getNextDashboardPathForMode({
        profile: {
          workerOnboardingCompletedAt: null,
          jefeOnboardingCompletedAt: null
        }
      }, 'jefe')
    ).toBe('/dashboard/onboarding/jefe');

    expect(
      getNextDashboardPathForMode({
        profile: {
          workerOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
          jefeOnboardingCompletedAt: null
        }
      }, 'trabajador')
    ).toBe('/dashboard/trabajador');
  });
});
