import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('dashboard app shell', () => {
  const dashboardPanelSource = readFileSync(
    join(process.cwd(), 'src/components/dashboard/dashboard-panel.tsx'),
    'utf8'
  );

  test('exposes profile and notifications as app-style header controls', () => {
    expect(dashboardPanelSource).toContain('aria-label="Abrir perfil"');
    expect(dashboardPanelSource).toContain('aria-label="Abrir notificaciones"');
    expect(dashboardPanelSource).toContain('notificationPopoverOpen');
  });

  test('keeps address management inside the profile view', () => {
    expect(dashboardPanelSource).toContain('Direcciones guardadas');
    expect(dashboardPanelSource).toContain('Agregar dirección');
    expect(dashboardPanelSource).not.toContain("view === 'direcciones'");
  });
});
