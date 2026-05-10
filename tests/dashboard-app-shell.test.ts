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

  test('uses the editable dashboard profile inside each mode profile route', () => {
    const jefeProfilePage = readFileSync(join(process.cwd(), 'src/app/dashboard/jefe/perfil/page.tsx'), 'utf8');
    const trabajadorProfilePage = readFileSync(
      join(process.cwd(), 'src/app/dashboard/trabajador/perfil/page.tsx'),
      'utf8'
    );

    expect(jefeProfilePage).toContain("view: 'perfil'");
    expect(jefeProfilePage).toContain('<DashboardPanelClient');
    expect(jefeProfilePage).toContain('initialMode="client"');
    expect(trabajadorProfilePage).toContain("view: 'perfil'");
    expect(trabajadorProfilePage).toContain('<DashboardPanelClient');
    expect(trabajadorProfilePage).toContain('initialMode="contractor"');
  });

  test('shows mode switching as a visible profile action', () => {
    expect(dashboardPanelSource).toContain('Cambiar modo');
    expect(dashboardPanelSource).toContain('Usar modo Jefe');
    expect(dashboardPanelSource).toContain('Usar modo Trabajador');
    expect(dashboardPanelSource).toContain('/dashboard/jefe/perfil');
    expect(dashboardPanelSource).toContain('/dashboard/trabajador/perfil');
  });

  test('shows sign out as a visible profile action', () => {
    expect(dashboardPanelSource).toContain('Sesión');
    expect(dashboardPanelSource).toContain('Salir de la cuenta');
    expect(dashboardPanelSource).toContain('Cerrar sesión');
    expect(dashboardPanelSource).toContain('variant="destructive"');
  });

  test('shows client emergency creation and existing requests in the urgencies view', () => {
    expect(dashboardPanelSource).toContain('Crear nueva urgencia');
    expect(dashboardPanelSource).toContain('Mis urgencias creadas');
    expect(dashboardPanelSource).toContain('emergencies.map');
    expect(dashboardPanelSource).toContain('initialEmergencies');
  });

  test('shows emergency availability only while the active mode is trabajador', () => {
    expect(dashboardPanelSource).toContain("activeMode === 'contractor'");
    expect(dashboardPanelSource).toContain('Disponibilidad para urgencias');
    expect(dashboardPanelSource).not.toContain("(user.roles.includes('contractor') || user.contractorProfile) ? (");
  });
});
