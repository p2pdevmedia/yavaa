import { describe, expect, test } from 'vitest';

import {
  dashboardDefaultPath,
  dashboardNavigationItems,
  dashboardNotificationPath,
  dashboardProfilePath,
  getModeSelectionPath
} from '@/lib/dashboard-routes';

describe('dashboard routes', () => {
  test('defines the primary dashboard tabs in navigation order', () => {
    expect(dashboardNavigationItems.map((item) => item.href)).toEqual([
      '/dashboard/urgencias',
      '/dashboard/bookings',
      '/dashboard/admin'
    ]);
  });

  test('keeps profile and notifications as header actions', () => {
    expect(dashboardDefaultPath).toBe('/dashboard/seleccionar-modo');
    expect(dashboardProfilePath).toBe('/dashboard/perfil');
    expect(dashboardNotificationPath).toBe('/dashboard/notificaciones');
  });

  test('sends users without addresses to load one before entering jefe mode', () => {
    expect(
      getModeSelectionPath('jefe', {
        addresses: [],
        contractorProfile: null
      })
    ).toBe('/dashboard/jefe/perfil');

    expect(
      getModeSelectionPath('jefe', {
        addresses: [{ id: 'address_001' }],
        contractorProfile: null
      })
    ).toBe('/dashboard/jefe');
  });

  test('sends users without worker data to the trabajador signup surface', () => {
    expect(
      getModeSelectionPath('trabajador', {
        addresses: [{ id: 'address_001' }],
        contractorProfile: null
      })
    ).toBe('/dashboard/trabajador/perfil');

    expect(
      getModeSelectionPath('trabajador', {
        addresses: [{ id: 'address_001' }],
        contractorProfile: {
          dniNumber: '12345678',
          addressId: 'address_001'
        }
      })
    ).toBe('/dashboard/trabajador');
  });
});
