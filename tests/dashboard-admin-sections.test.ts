import { describe, expect, test } from 'vitest';

import { dashboardAdminSections } from '@/lib/dashboard-admin-sections';

describe('dashboard admin sections', () => {
  test('defines the admin submenu in operational order', () => {
    expect(dashboardAdminSections).toEqual([
      { id: 'usuarios', label: 'Usuarios', href: '/dashboard/admin/usuarios' },
      { id: 'contractors', label: 'Contractors', href: '/dashboard/admin/contractors' },
      { id: 'categorias', label: 'Categorías', href: '/dashboard/admin/categorias' },
      { id: 'bookings', label: 'Bookings', href: '/dashboard/admin/bookings' }
    ]);
  });
});
