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
  const floatingUserControlsSource = readFileSync(
    join(process.cwd(), 'src/components/app-shell/floating-user-controls.tsx'),
    'utf8'
  );

  test('exposes profile and notifications as app-style header controls', () => {
    expect(floatingUserControlsSource).toContain('aria-label="Abrir menú de perfil"');
    expect(floatingUserControlsSource).toContain('accountPopoverOpen');
    expect(floatingUserControlsSource).toContain('aria-label="Abrir notificaciones"');
    expect(floatingUserControlsSource).toContain('notificationPopoverOpen');
  });

  test('keeps account actions inside the profile avatar menu', () => {
    expect(floatingUserControlsSource).toContain('Cambiar de modo');
    expect(floatingUserControlsSource).toContain('<SignOutButton');
    expect(dashboardPanelSource).not.toContain('<SignOutButton');
    expect(dashboardPanelSource).not.toContain('Modo de uso');
    expect(dashboardNavigationSource).not.toContain('SignOutButton');
  });

  test('shows the current mode as a small floating icon instead of a header label', () => {
    expect(floatingUserControlsSource).toContain('Glasses');
    expect(floatingUserControlsSource).toContain('HardHat');
    expect(floatingUserControlsSource).toContain('aria-label={`Modo activo: ${activeModeLabel}`}');
    expect(dashboardPanelSource).not.toContain('<p className="text-muted-foreground">Contractor</p>');
  });

  test('keeps address management inside the profile view', () => {
    expect(dashboardPanelSource).toContain('Direcciones guardadas');
    expect(dashboardPanelSource).toContain('Agregar dirección');
    expect(dashboardPanelSource).not.toContain("view === 'direcciones'");
  });

  test('does not expose contractor access API metadata on the profile page', () => {
    expect(dashboardPanelSource).not.toContain('Contractor y acceso');
    expect(dashboardPanelSource).not.toContain('Esto refleja los datos que ya expone la API protegida de etapa 02.');
    expect(dashboardPanelSource).not.toContain('Estado contractor');
    expect(dashboardPanelSource).not.toContain('Supabase auth ID');
  });

  test('hides saved address management while the active mode is trabajador', () => {
    const savedAddressesIndex = dashboardPanelSource.indexOf('Direcciones guardadas');
    const conditionStart = dashboardPanelSource.lastIndexOf("{view === 'perfil'", savedAddressesIndex);
    const condition = dashboardPanelSource.slice(conditionStart, savedAddressesIndex);

    expect(savedAddressesIndex).toBeGreaterThan(-1);
    expect(condition).toContain("activeMode === 'client'");
  });

  test('uses Argentina catalog selectors for web address province and city', () => {
    const dashboardViewPageSource = readFileSync(
      join(process.cwd(), 'src/app/dashboard/dashboard-view-page.tsx'),
      'utf8'
    );

    expect(dashboardViewPageSource).toContain('listPublicCatalogLocations');
    expect(dashboardViewPageSource).toContain('addressLocations');
    expect(dashboardPanelSource).toContain('addressLocations: PublicCatalogLocation[]');
    expect(dashboardPanelSource).toContain('provinceOptions');
    expect(dashboardPanelSource).toContain('cityOptions');
    expect(dashboardPanelSource).toContain('selectedAddressMarket');
    expect(dashboardPanelSource).toContain('<select');
    expect(dashboardPanelSource).toContain('id="province"');
    expect(dashboardPanelSource).toContain('id="city"');
    expect(dashboardPanelSource).not.toContain('<Input\n                    id="city"');
    expect(dashboardPanelSource).not.toContain('<Input\n                    id="province"');
  });

  test('lets users attach geolocation to saved addresses', () => {
    expect(dashboardPanelSource).toContain('handleAddressGeolocation');
    expect(dashboardPanelSource).toContain('Cargar geolocalización');
    expect(dashboardPanelSource).toContain('id="address-latitude"');
    expect(dashboardPanelSource).toContain('id="address-longitude"');
    expect(dashboardPanelSource).toContain('latitude: addressLatitude');
    expect(dashboardPanelSource).toContain('longitude: addressLongitude');
  });

  test('does not submit fallback demo market ids when saving addresses', () => {
    expect(dashboardPanelSource).toContain('selectedAddressMarketId');
    expect(dashboardPanelSource).toContain('isUuid');
    expect(dashboardPanelSource).toContain('marketId: selectedAddressMarketId');
    expect(dashboardPanelSource).not.toContain('marketId: selectedAddressMarket.id');
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

  test('moves mode switching from the profile page into the profile avatar control', () => {
    expect(dashboardPanelSource).not.toContain('Cambiar modo');
    expect(dashboardPanelSource).not.toContain('Usar modo Jefe');
    expect(dashboardPanelSource).not.toContain('Usar modo Trabajador');
    expect(floatingUserControlsSource).toContain('Cambiar de modo');
    expect(floatingUserControlsSource).toContain('Jefe');
    expect(floatingUserControlsSource).toContain('Trabajador');
    expect(floatingUserControlsSource).toContain('/dashboard/jefe/perfil');
    expect(floatingUserControlsSource).toContain('/dashboard/trabajador/perfil');
  });

  test('keeps sign out in the top profile avatar menu only', () => {
    expect(floatingUserControlsSource).toContain('<SignOutButton');
    expect(dashboardPanelSource).not.toContain('Cerrar sesión en este dispositivo');
    expect(dashboardPanelSource).not.toContain('Salir de la cuenta actual.');
    expect(dashboardPanelSource).not.toContain('<SignOutButton');
  });

  test('shows client emergency creation and existing requests in the urgencies view', () => {
    expect(dashboardPanelSource).toContain('Crear nueva urgencia');
    expect(dashboardPanelSource).toContain('Mis urgencias creadas');
    expect(dashboardPanelSource).toContain('visibleEmergencies.map');
    expect(dashboardPanelSource).toContain('initialEmergencies');
    expect(dashboardPanelSource).toContain('Editar urgencia');
    expect(dashboardPanelSource).toContain('Borrar urgencia');
    expect(dashboardPanelSource).toContain('Marcar resuelta');
    expect(dashboardPanelSource).toContain('Extender 24 horas');
  });

  test('shows expired emergencies as a contractor-only tab inside the urgencies view', () => {
    expect(dashboardPanelSource).toContain('contractorEmergencyTab');
    expect(dashboardPanelSource).toContain('isExpiredContractorEmergency');
    expect(dashboardPanelSource).toContain('role="tablist"');
    expect(dashboardPanelSource).toContain('Disponibles');
    expect(dashboardPanelSource).toContain('Expiradas');
    expect(dashboardPanelSource).toContain('No hay urgencias expiradas.');
  });

  test('formats emergency timestamps with the browser local timezone helper', () => {
    expect(dashboardPanelSource).toContain("import { formatLocalDateTime } from '@/lib/date-format'");
    expect(dashboardPanelSource).not.toContain('function formatUtcDateTime');
    expect(dashboardPanelSource).toContain('formatLocalDateTime(emergency.createdAt)');
    expect(dashboardPanelSource).toContain('formatLocalDateTime(emergency.expiresAt)');
  });

  test('updates the expired emergency card locally after extending it', () => {
    expect(dashboardPanelSource).toContain('const extendedEmergency = toDashboardEmergencyFromApi');
    expect(dashboardPanelSource).toContain(
      'current.map((emergency) => (emergency.id === emergencyId ? extendedEmergency : emergency))'
    );
  });

  test('shows emergency availability only while the active mode is trabajador', () => {
    expect(dashboardPanelSource).toContain("activeMode === 'contractor'");
    expect(dashboardPanelSource).toContain('Disponibilidad para urgencias');
    expect(dashboardPanelSource).not.toContain("(user.roles.includes('contractor') || user.contractorProfile) ? (");
  });

  test('places emergency availability inside the trabajador profile area', () => {
    const contractorProfileIndex = dashboardPanelSource.indexOf('Perfil laboral');
    const emergencyAvailabilityIndex = dashboardPanelSource.indexOf('Disponibilidad para urgencias');
    const addressesIndex = dashboardPanelSource.indexOf('Direcciones guardadas');

    expect(contractorProfileIndex).toBeGreaterThan(-1);
    expect(emergencyAvailabilityIndex).toBeGreaterThan(contractorProfileIndex);
    expect(emergencyAvailabilityIndex).toBeLessThan(addressesIndex);
  });

  test('shows the contractor profile form only while the active mode is trabajador', () => {
    expect(dashboardPanelSource).toContain("activeMode === 'contractor' ? (");
    expect(dashboardPanelSource).toContain('Perfil laboral');
    expect(dashboardPanelSource).toContain('DNI');
    expect(dashboardPanelSource).toContain('Guardar datos de trabajador');
    expect(dashboardPanelSource).toContain("fetch('/api/me/contractor-profile'");
  });

  test('shows approved contractor profiles as submitted read-only data', () => {
    expect(dashboardPanelSource).toContain('isContractorProfileApproved');
    expect(dashboardPanelSource).toContain('Datos enviados');
    expect(dashboardPanelSource).toContain('Tu perfil laboral ya fue aprobado.');
    expect(dashboardPanelSource).toContain('submittedContractorAddress');
    expect(dashboardPanelSource).toContain('submittedContractorCategoryNames');
    expect(dashboardPanelSource).toContain('submittedContractorHourlyRate');
  });

  test('uses the account profile photo for contractors and uploads only DNI photos', () => {
    expect(dashboardPanelSource).not.toContain('contractor-profile-photo-file');
    expect(dashboardPanelSource).not.toContain('contractorProfilePhotoFile');
    expect(dashboardPanelSource).not.toContain("formData.set('profilePhotoFile'");
    expect(dashboardPanelSource).toContain('dniFrontFile');
    expect(dashboardPanelSource).toContain('dniBackFile');
    expect(dashboardPanelSource).not.toContain('contractor-profile-photo-url');
    expect(dashboardPanelSource).not.toContain('contractor-dni-front-url');
    expect(dashboardPanelSource).not.toContain('contractor-dni-back-url');
  });

  test('shows saved contractor DNI images as expandable previews', () => {
    expect(dashboardPanelSource).toContain('ContractorDniPreview');
    expect(dashboardPanelSource).toContain('aria-label={`Ampliar ${label}`}');
    expect(dashboardPanelSource).toContain('label="DNI frente"');
    expect(dashboardPanelSource).toContain('label="DNI dorso"');
    expect(dashboardPanelSource).toContain('selectedDniPreview');
    expect(dashboardPanelSource).toContain('Vista ampliada');
    expect(dashboardPanelSource).not.toContain('DNI frente guardado.');
    expect(dashboardPanelSource).not.toContain('DNI dorso guardado.');
  });

  test('keeps admin pages inside a bottom navigation shell', () => {
    const adminLayoutSource = readFileSync(join(process.cwd(), 'src/app/dashboard/admin/layout.tsx'), 'utf8');

    expect(adminLayoutSource).toContain('JefeShell');
    expect(adminLayoutSource).toContain('<JefeShell isAdmin>');
  });
});
