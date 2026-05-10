import { describe, expect, test } from 'vitest';

import {
  dashboardDefaultPath,
  dashboardNavigationItems,
  dashboardNotificationPath,
  dashboardProfilePath
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
    expect(dashboardDefaultPath).toBe('/dashboard/perfil');
    expect(dashboardProfilePath).toBe('/dashboard/perfil');
    expect(dashboardNotificationPath).toBe('/dashboard/notificaciones');
  });
});
