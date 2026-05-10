import { describe, expect, test } from 'vitest';

import { dashboardDefaultPath, dashboardNavigationItems } from '@/lib/dashboard-routes';

describe('dashboard routes', () => {
  test('defines the separate dashboard views in navigation order', () => {
    expect(dashboardNavigationItems.map((item) => item.href)).toEqual([
      '/dashboard/perfil',
      '/dashboard/direcciones',
      '/dashboard/urgencias',
      '/dashboard/notificaciones',
      '/dashboard/bookings',
      '/dashboard/admin'
    ]);
  });

  test('uses profile as the default dashboard view', () => {
    expect(dashboardDefaultPath).toBe('/dashboard/perfil');
  });
});
