import type { Route } from 'next';

export type DashboardView = 'perfil' | 'urgencias' | 'bookings' | 'admin';

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
