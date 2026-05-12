import { describe, expect, it } from 'vitest';

import { getModeSelectionPath } from '@/lib/dashboard-routes';

describe('dashboard routes', () => {
  it('keeps mode selection inside the profile selection screen', () => {
    expect(getModeSelectionPath('jefe')).toBe('/dashboard/seleccionar-modo?perfil=jefe');
    expect(getModeSelectionPath('trabajador')).toBe('/dashboard/seleccionar-modo?perfil=trabajador');
  });
});
