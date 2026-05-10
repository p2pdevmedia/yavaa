import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('dashboard app shell', () => {
  const dashboardPanelSource = readFileSync(
    join(process.cwd(), 'src/components/dashboard/dashboard-panel.tsx'),
    'utf8'
  );
  const dashboardNavigationSource = readFileSync(
    join(process.cwd(), 'src/components/dashboard/dashboard-navigation.tsx'),
    'utf8'
  );

  test('exposes profile and notifications as app-style header controls', () => {
    expect(dashboardPanelSource).toContain('aria-label="Abrir menú de perfil"');
    expect(dashboardPanelSource).toContain('accountPopoverOpen');
    expect(dashboardPanelSource).toContain('aria-label="Abrir notificaciones"');
    expect(dashboardPanelSource).toContain('notificationPopoverOpen');
  });

  test('keeps account actions inside the profile avatar menu', () => {
    expect(dashboardPanelSource).toContain('Cambiar de modo');
    expect(dashboardPanelSource).toContain('<SignOutButton');
    expect(dashboardPanelSource).not.toContain('Modo de uso');
    expect(dashboardNavigationSource).not.toContain('SignOutButton');
  });

  test('shows the current mode as a small floating icon instead of a header label', () => {
    expect(dashboardPanelSource).toContain('Glasses');
    expect(dashboardPanelSource).toContain('HardHat');
    expect(dashboardPanelSource).toContain('aria-label={`Modo activo: ${activeModeLabel}`}');
    expect(dashboardPanelSource).not.toContain('<p className="text-muted-foreground">Contractor</p>');
  });

  test('keeps address management inside the profile view', () => {
    expect(dashboardPanelSource).toContain('Direcciones guardadas');
    expect(dashboardPanelSource).toContain('Agregar dirección');
    expect(dashboardPanelSource).not.toContain("view === 'direcciones'");
  });
});
