import { describe, expect, test } from 'vitest';

import { dashboardAdminSections } from '@/lib/dashboard-admin-sections';

describe('dashboard admin sections', () => {
  test('defines the admin submenu in operational order', () => {
    expect(dashboardAdminSections).toEqual([
      { id: 'usuarios', label: 'Usuarios', href: '#usuarios' },
      { id: 'contractors', label: 'Contractors', href: '#contractors' },
      { id: 'categorias', label: 'Categorías', href: '#categorias' },
      { id: 'bookings', label: 'Bookings', href: '#bookings' }
    ]);
  });
});
