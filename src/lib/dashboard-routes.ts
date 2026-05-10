import type { Route } from 'next';

export type DashboardView = 'perfil' | 'urgencias' | 'bookings' | 'admin';
export type DashboardMode = 'jefe' | 'trabajador';

type ModeSelectionUserState = {
  addresses: Array<{ id: string }>;
  contractorProfile: {
    dniNumber: string | null;
    addressId: string | null;
  } | null;
};

export type DashboardNavigationItem = {
  href: Route;
  label: string;
  view: DashboardView;
};

export const dashboardDefaultPath = '/dashboard/seleccionar-modo' as Route;
export const dashboardProfilePath = '/dashboard/perfil' as Route;
export const dashboardNotificationPath = '/dashboard/notificaciones' as Route;

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  { href: '/dashboard/urgencias' as Route, label: 'Urgencias', view: 'urgencias' },
  { href: '/dashboard/bookings' as Route, label: 'Bookings', view: 'bookings' },
  { href: '/dashboard/admin' as Route, label: 'Admin', view: 'admin' }
];

export function getModeSelectionPath(mode: DashboardMode, user: ModeSelectionUserState): Route {
  if (mode === 'jefe') {
    return user.addresses.length > 0 ? ('/dashboard/jefe' as Route) : ('/dashboard/jefe/perfil' as Route);
  }

  const hasWorkerSignupData = Boolean(user.contractorProfile?.dniNumber && user.contractorProfile.addressId);

  return hasWorkerSignupData ? ('/dashboard/trabajador' as Route) : ('/dashboard/trabajador/perfil' as Route);
}
