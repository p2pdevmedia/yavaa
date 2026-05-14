import { describe, expect, it } from 'vitest';

import {
  getDashboardBottomTabsForMode,
  getDashboardHomePath,
  getDashboardModeFromPathname,
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

  it('infers the active dashboard mode from protected dashboard paths', () => {
    expect(getDashboardModeFromPathname('/dashboard/jefe')).toBe('jefe');
    expect(getDashboardModeFromPathname('/dashboard/jefe/buscar-trabajadores')).toBe('jefe');
    expect(getDashboardModeFromPathname('/dashboard/trabajador')).toBe('trabajador');
    expect(getDashboardModeFromPathname('/dashboard/trabajador/perfil')).toBe('trabajador');
    expect(getDashboardModeFromPathname('/dashboard/seleccionar-modo')).toBeNull();
    expect(getDashboardModeFromPathname('/sign-in')).toBeNull();
  });

  it('builds bottom tabs with Inicio, contextual mode access and Perfil', () => {
    expect(getDashboardBottomTabsForMode('jefe')).toEqual([
      {
        href: '/dashboard/jefe',
        isActive: expect.any(Function),
        label: 'Inicio'
      },
      {
        href: '/dashboard/jefe/buscar-trabajadores',
        isActive: expect.any(Function),
        label: 'Trabajadores'
      },
      {
        href: '/dashboard/jefe/perfil',
        isActive: expect.any(Function),
        label: 'Perfil'
      }
    ]);

    expect(getDashboardBottomTabsForMode('trabajador')).toEqual([
      {
        href: '/dashboard/trabajador',
        isActive: expect.any(Function),
        label: 'Inicio'
      },
      {
        href: '/dashboard/trabajador/trabajos',
        isActive: expect.any(Function),
        label: 'Trabajos'
      },
      {
        href: '/dashboard/trabajador/perfil',
        isActive: expect.any(Function),
        label: 'Perfil'
      }
    ]);
  });

  it('marks bottom tabs active from their matching dashboard paths', () => {
    const jefeTabs = getDashboardBottomTabsForMode('jefe');
    const workerTabs = getDashboardBottomTabsForMode('trabajador');

    expect(jefeTabs.find((tab) => tab.label === 'Inicio')?.isActive('/dashboard/jefe')).toBe(true);
    expect(jefeTabs.find((tab) => tab.label === 'Inicio')?.isActive('/dashboard/jefe/trabajos/123')).toBe(false);
    expect(jefeTabs.find((tab) => tab.label === 'Trabajadores')?.isActive('/dashboard/jefe/buscar-trabajadores')).toBe(true);
    expect(jefeTabs.find((tab) => tab.label === 'Perfil')?.isActive('/dashboard/jefe/perfil')).toBe(true);
    expect(workerTabs.find((tab) => tab.label === 'Trabajos')?.isActive('/dashboard/trabajador/trabajos/123')).toBe(true);
    expect(workerTabs.find((tab) => tab.label === 'Perfil')?.isActive('/dashboard/trabajador/perfil')).toBe(true);
  });
});
