import { describe, expect, test } from 'vitest';

import {
  getActiveShellNavigationHref,
  getDefaultShellPath,
  getShellNavigationItems,
  getUrgenciesIntent,
  type AppShellMode
} from '@/lib/app-shell-navigation';

describe('app shell navigation', () => {
  test.each([
    ['guest', ['Inicio', 'Urgencias', 'Perfil']],
    ['jefe', ['Inicio', 'Urgencias', 'Mis Casas', 'Trabajadores', 'Perfil']],
    ['trabajador', ['Inicio', 'Urgencias', 'Mis Clientes', 'Perfil']]
  ] satisfies Array<[AppShellMode, string[]]>)(
    'defines the bottom native tabs for %s mode',
    (mode, labels) => {
      expect(getShellNavigationItems(mode).map((item) => item.label)).toEqual(labels);
    }
  );

  test('keeps each mode in its own route namespace', () => {
    expect(getDefaultShellPath('guest')).toBe('/');
    expect(getDefaultShellPath('jefe')).toBe('/dashboard/jefe');
    expect(getDefaultShellPath('trabajador')).toBe('/dashboard/trabajador');
  });

  test('uses the same Urgencias tab label with mode-specific behavior', () => {
    expect(getUrgenciesIntent('guest')).toBe('draft-before-auth');
    expect(getUrgenciesIntent('jefe')).toBe('publish-emergency');
    expect(getUrgenciesIntent('trabajador')).toBe('browse-emergencies');
  });

  test('selects the most specific active tab for nested mode routes', () => {
    const jefeItems = getShellNavigationItems('jefe');
    const trabajadorItems = getShellNavigationItems('trabajador');

    expect(getActiveShellNavigationHref('/dashboard/jefe', jefeItems)).toBe('/dashboard/jefe');
    expect(getActiveShellNavigationHref('/dashboard/jefe/perfil', jefeItems)).toBe('/dashboard/jefe/perfil');
    expect(getActiveShellNavigationHref('/dashboard/jefe/urgencias', jefeItems)).toBe('/dashboard/jefe/urgencias');
    expect(getActiveShellNavigationHref('/dashboard/trabajador/perfil', trabajadorItems)).toBe(
      '/dashboard/trabajador/perfil'
    );
  });
});
